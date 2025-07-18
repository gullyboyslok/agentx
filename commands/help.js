const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show available commands and usage.'),

  async execute(interaction) {
    await interaction.reply({
      content: `🧠 **Agent Bot Help**  
Here are the commands you can use:

> 🔧 **/configure (model) (apikey)**  
Set your LLM model and Model API key for this server.

> 🧪 **/new (agentname) (purpose)**  
Create a new agent with a purpose (e.g. ML developer, data analyst).

> 🧠 **/run (agentname) (prompt)**  
Ask your agent something. Uses its context + your prompt.

> 📃 **/list**
List all your agents and click on individual agents to learn more about their purpose and context.

> 🗑️ **/delete (agent or context) (agentname or contextname)**
Delete specific agents or their context files.

> 📎 **/add (agentname) [file upload]** 
Upload files to give the agent context.

> 🎯 **/o (prompt) (agentnames)**
Orchestrate multiple agents to accomplish a single task.

> ℹ️ **/help**  
Display this help message.

Make sure to **run /configure first** before using any other commands.`, 
      ephemeral: true
    });
  }
};
