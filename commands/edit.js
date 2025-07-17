// commands/edit.js
const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const configPath = path.join(__dirname, '..', 'config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('edit')
    .setDescription('Edit an agent\'s name or purpose (or both).')
    .addStringOption(option =>
      option.setName('agentname')
        .setDescription('Current name of the agent')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('newname')
        .setDescription('New name for the agent (optional)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('newpurpose')
        .setDescription('New purpose or prompt (optional)')
        .setRequired(false)),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const oldName = interaction.options.getString('agentname');
    const newName = interaction.options.getString('newname');
    const newPurpose = interaction.options.getString('newpurpose');

    if (!fs.existsSync(configPath)) {
      return await interaction.reply('No configuration found.');
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const serverConfig = config[guildId];

    if (!serverConfig || !serverConfig.agents[oldName]) {
      return await interaction.reply(`Agent "${oldName}" not found.`);
    }

    // No changes provided
    if (!newName && !newPurpose) {
      return await interaction.reply('Please specify at least a new name or a new purpose.');
    }

    const agent = serverConfig.agents[oldName];

    // Handle renaming
    if (newName) {
      if (serverConfig.agents[newName]) {
        return await interaction.reply(`An agent named "${newName}" already exists.`);
      }

      serverConfig.agents[newName] = { ...agent };
      delete serverConfig.agents[oldName];
    }

    // Handle purpose update
    if (newPurpose) {
      const target = newName ? serverConfig.agents[newName] : agent;
      target.purpose = newPurpose;
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const resultName = newName || oldName;
    let msg = `✅ Updated agent **${oldName}**`;

    if (newName) msg += ` → **${newName}**`;
    if (newPurpose) msg += `\nNew purpose: *${newPurpose}*`;

    await interaction.reply(msg);
  }
};
