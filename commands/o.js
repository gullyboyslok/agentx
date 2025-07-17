// commands/o.js
const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const GeminiService = require('../gemini');
const configPath = path.join(__dirname, '..', 'config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('o')
    .setDescription('Orchestrate multiple agents to complete a complex task.')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('The main task you want to accomplish')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('agents')
        .setDescription('Comma-separated list of agent names (e.g., pycoder, tester, debugger)')
        .setRequired(true)),

  async execute(interaction) {
    const mainPrompt = interaction.options.getString('prompt');
    const agentsInput = interaction.options.getString('agents');
    const guildId = interaction.guild.id;

    await interaction.deferReply();

    if (!fs.existsSync(configPath)) {
      return await interaction.editReply('No configuration found. Please run `/configure` first.');
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const serverConfig = config[guildId];
    if (!serverConfig) {
      return await interaction.editReply('No configuration found. Please run `/configure` first.');
    }

    const agentNames = agentsInput.split(',').map(name => name.trim());
    const missingAgents = [];
    const validAgents = [];

    for (const agentName of agentNames) {
      const agent = serverConfig.agents?.[agentName];
      if (!agent) {
        missingAgents.push(agentName);
      } else {
        validAgents.push({
          name: agentName,
          purpose: agent.purpose
        });
      }
    }

    if (missingAgents.length > 0) {
      return await interaction.editReply(`The following agents were not found: ${missingAgents.join(', ')}. Create them first using \`/new\`.`);
    }

    const fetchedMessages = await interaction.channel.messages.fetch({ limit: 100 });
    const sorted = [...fetchedMessages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const recentChatLog = sorted.map(msg => `${msg.author.username}: ${msg.content}`).join('\n');

    const agentPurposes = validAgents.map(agent => `${agent.name}: ${agent.purpose}`).join('\n');
    const agentNamesStr = validAgents.map(agent => agent.name).join(', ');

    const orchestrationPrompt = `
You are an AI orchestrator coordinating agents: ${agentNamesStr}.
Your job is to intelligently break down and delegate parts of this task: "${mainPrompt}" to each agent, using their purpose and recent server chat context.

Recent server chat context:
${recentChatLog}

Agent capabilities:
${agentPurposes}

Follow this output format:
---
Orchestration completed using (${agentNamesStr}) to accomplish "${mainPrompt}".
${validAgents.map(agent => `${agent.name}: (${agent.name} output)`).join('\n')}

Final compiled output: (expected output for the original prompt)
`;

    const orchestratorSystemPrompt = `You are an AI orchestrator that coordinates multiple specialized agents to complete complex tasks. You understand each agent's capabilities and can simulate their outputs to create a cohesive workflow.`;

    const orchestrator = new GeminiService(serverConfig.apiKey, serverConfig.model, orchestratorSystemPrompt);

    try {
      const response = await orchestrator.sendMessage(orchestrationPrompt);
      const header = `**Orchestration Request**\n**Task:** ${mainPrompt}\n**Agents:** ${agentNamesStr}\n\n**Result:**\n\n`;
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
    } catch (error) {
      console.error('Orchestration error:', error);
      await interaction.editReply('Failed to orchestrate agents. Please try again.');
    }
  }
};
