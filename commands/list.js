const fs = require('fs');
const path = require('path');
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType
} = require('discord.js');

const configPath = path.join(__dirname, '..', 'config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('List all configured agents with interactive buttons.'),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    if (!fs.existsSync(configPath)) {
      return await interaction.reply({
        content: 'No configuration found. Please run `/configure` first.',
        ephemeral: false
      });
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const serverConfig = config[guildId];

    if (!serverConfig || !serverConfig.agents || Object.keys(serverConfig.agents).length === 0) {
      return await interaction.reply({
        content: 'No agents found for this server.',
        ephemeral: false
      });
    }

    const agents = serverConfig.agents;

    // Create buttons for each agent (max 5 per row)
    const buttons = Object.keys(agents).map(agentName =>
      new ButtonBuilder()
        .setCustomId(`agent_${agentName}`)
        .setLabel(agentName)
        .setStyle(ButtonStyle.Primary)
    );

    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
    }

    await interaction.reply({
      content: 'Select an agent to see details:',
      components: rows,
      ephemeral: false
    });

    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000 // 2 minutes
    });

    collector.on('collect', async i => {
      //if (i.user.id !== interaction.user.id) {
        //return i.reply({ content: "You can't use this interaction.", ephemeral: true });
      //}

      if (i.customId === 'back_to_list') {
        return i.update({
          content: 'Select an agent to see details:',
          components: rows,
          embeds: []
        });
      }

      if (i.customId.startsWith('agent_')) {
        const selectedAgent = i.customId.slice(6);
        const agentData = agents[selectedAgent];

        const purpose = agentData.purpose || 'No description available.';
        const contextFiles = agentData.context || [];

        const embed = new EmbedBuilder()
          .setTitle(`Agent: ${selectedAgent}`)
          .setDescription(purpose)
          .addFields({
            name: 'Context files',
            value: contextFiles.length > 0
              ? contextFiles.map((ctx, idx) => `• Context #${idx + 1}`).join('\n')
              : 'No context files attached.'
          })
          .setColor(0x0099ff);

        const backButton = new ButtonBuilder()
          .setCustomId('back_to_list')
          .setLabel('Back')
          .setStyle(ButtonStyle.Secondary);

        const backRow = new ActionRowBuilder().addComponents(backButton);

        await i.update({
          content: 'Agent details:',
          embeds: [embed],
          components: [backRow]
        });
      }
    });

    collector.on('end', async () => {
      if (!message.deleted) {
        try {
          await message.edit({ components: [] });
        } catch {}
      }
    });
  }
};
