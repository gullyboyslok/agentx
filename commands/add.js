const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Attach files you uploaded right before this command to an agent.')
    .addStringOption(option =>
      option.setName('agent')
        .setDescription('Agent name')
        .setRequired(true)
    ),

  async execute(interaction) {
    const agentName = interaction.options.getString('agent');
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    const configPath = path.join(__dirname, '../config.json');

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const guildConfig = config[guildId];

    if (!guildConfig || !guildConfig.agents || !guildConfig.agents[agentName]) {
      return interaction.reply(`Agent "${agentName}" not found.`);
    }

    // Fetch recent messages to look for one with attachments from the same user
    const messages = await interaction.channel.messages.fetch({ limit: 10 });
    const previousMessageWithFiles = messages
      .filter(m => m.author.id === userId && m.attachments.size > 0)
      .first();

    if (!previousMessageWithFiles) {
      return interaction.reply('No files found in your previous message. Please upload files before using `/add`.');
    }

    const contextList = guildConfig.agents[agentName].context || [];
    const uploadedFileNames = [];

    for (const file of previousMessageWithFiles.attachments.values()) {
      try {
        const response = await fetch(file.url);
        const text = await response.text();
        contextList.push(text);
        uploadedFileNames.push(file.name);
      } catch (err) {
        console.error(`Error downloading file ${file.name}:`, err);
      }
    }

    guildConfig.agents[agentName].context = contextList;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return interaction.reply(`Added ${uploadedFileNames.length} file(s) to agent **${agentName}**:\n- ${uploadedFileNames.join('\n- ')}`);
  }
};
