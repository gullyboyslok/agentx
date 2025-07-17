const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const configPath = path.join(__dirname, '..', 'config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('new')
    .setDescription('Create a new agent with a given purpose.')
    .addStringOption(option =>
      option.setName('agentname')
        .setDescription('Name of the agent')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('purpose')
        .setDescription('One-sentence purpose of the agent')
        .setRequired(true)),

  async execute(interaction) {
    const agentName = interaction.options.getString('agentname');
    const purpose = interaction.options.getString('purpose');
    const guildId = interaction.guild.id;

    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }

    if (!config[guildId]) {
      return await interaction.reply('Please run `/configure` first.');
    }

    if (config[guildId].agents[agentName]) {
      return await interaction.reply(`Agent "${agentName}" already exists.`);
    }

    config[guildId].agents[agentName] = {
      purpose,
      context: []
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    await interaction.reply(`New agent **${agentName}** created with purpose **${purpose}**. Use \`/add ${agentName}\` after uploading files to provide context and \`/run ${agentName}\` to prompt your agent.`);
  }
};
