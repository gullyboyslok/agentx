// commands/run.js
const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const GeminiService = require('../gemini');

const configPath = path.join(__dirname, '..', 'config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('run')
    .setDescription('Ask a prompt to your configured agent.')
    .addStringOption(option =>
      option.setName('agentname')
        .setDescription('The name of the agent you want to use')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('Your question or prompt')
        .setRequired(true)),

  async execute(interaction) {
    const agentName = interaction.options.getString('agentname');
    const prompt = interaction.options.getString('prompt');
    const guildId = interaction.guild.id;

    if (!fs.existsSync(configPath)) {
      return await interaction.reply('No configuration found. Please run `/configure` first.');
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const serverConfig = config[guildId];
    if (!serverConfig) {
      return await interaction.reply('No configuration found. Please run `/configure` first.');
    }

    const agent = serverConfig.agents?.[agentName];
    if (!agent) {
      return await interaction.reply(`Agent "${agentName}" not found. Use \`/new ${agentName}\` first.`);
    }

    const fetchedMessages = await interaction.channel.messages.fetch({ limit: 100 });
    const sorted = [...fetchedMessages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const recentMessages = sorted.map(msg => `${msg.author.username}: ${msg.content}`).join('\n');

    const systemPrompt = agent.purpose
      ? `You are an AI assistant called "${agentName}". Your purpose is to ${agent.purpose}.`
      : `You are an AI assistant called "${agentName}".`;

    const baseContext = agent.context?.join('\n\n') || '';
    const combinedContext = `Recent chat history:\n${recentMessages}\n\nAgent context:\n${baseContext}`;

    const gemini = new GeminiService(serverConfig.apiKey, serverConfig.model, systemPrompt);

    await interaction.deferReply();

    try {
      const response = await gemini.sendMessage(prompt, combinedContext);
      const header = `**Agent:** ${agentName}\n**Prompt:** ${prompt}\n**Response:**\n\n`;
      const chunks = [];

      let currentChunk = header;
      for (const line of response.split('\n')) {
        if ((currentChunk + line + '\n').length > 2000) {
          chunks.push(currentChunk);
          currentChunk = '';
        }
        currentChunk += line + '\n';
      }
      chunks.push(currentChunk);

      await interaction.editReply(chunks.shift());
      for (const chunk of chunks) {
        await interaction.followUp({ content: chunk });
      }
    } catch (err) {
      console.error('Gemini error:', err);
      await interaction.editReply('Error while getting a response from Gemini.');
    }
  }
};
