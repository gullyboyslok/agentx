// commands/delete.js
const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const configPath = path.join(__dirname, '..', 'config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Delete an agent or one of its context files.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('agent')
        .setDescription('Delete an entire agent.')
        .addStringOption(option =>
          option.setName('agentname')
            .setDescription('The agent to delete')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('context')
        .setDescription('Delete a specific context file from an agent.')
        .addStringOption(option =>
          option.setName('agentname')
            .setDescription('The agent whose context you want to delete')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('index')
            .setDescription('Index of context to delete (starts at 1)')
            .setRequired(true))),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    if (!fs.existsSync(configPath)) {
      return await interaction.reply('No configuration found.');
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const serverConfig = config[guildId];

    if (!serverConfig || !serverConfig.agents) {
      return await interaction.reply('No agents found.');
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'agent') {
      const agentName = interaction.options.getString('agentname');
      if (!serverConfig.agents[agentName]) {
        return await interaction.reply(`Agent "${agentName}" not found.`);
      }

      delete serverConfig.agents[agentName];
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return await interaction.reply(`Agent **${agentName}** deleted successfully.`);
    }

    if (subcommand === 'context') {
      const agentName = interaction.options.getString('agentname');
      const index = interaction.options.getInteger('index') - 1;

      const agent = serverConfig.agents[agentName];
      if (!agent) {
        return await interaction.reply(`Agent "${agentName}" not found.`);
      }

      if (!agent.context || !agent.context[index]) {
        return await interaction.reply(`No context found at index ${index + 1}.`);
      }

      agent.context.splice(index, 1);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return await interaction.reply(`Deleted context #${index + 1} from agent **${agentName}**.`);
    }
  }
};
