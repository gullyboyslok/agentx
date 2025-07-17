const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

const configPath = path.join(__dirname, '..', 'config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configure')
    .setDescription('Configure the LLM model and API key for your server.')
    .addStringOption(option =>
      option.setName('model')
        .setDescription('LLM model name (e.g., gemini-1.5-flash)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('apikey')
        .setDescription('Your Gemini API key')
        .setRequired(true)),

  async execute(interaction) {
    const model = interaction.options.getString('model');
    const apiKey = interaction.options.getString('apikey');
    const guildId = interaction.guild.id;

    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }

    config[guildId] = {
      model,
      apiKey,
      agents: {}
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    await interaction.reply({
      content: `✅ Gemini has been set as the default brain.`,
      ephemeral: true
    });

  }
};
