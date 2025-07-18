# agentx
configure, provide context for, and utilize RAG agents in Discord just as you can in apps like Slack, Notion, and Den.

### agent specs/features

Provided the agent the last 100 messages in any given Discord conversation.
Bypassed the Discord message text limit by using multiple messages and an algorithm to automatically split the messages.
Dynamically inserted context (message history, files, purpose) into prompts for an LLM to improve its response.

### commands

/configure (model name) (api key)
Used to set up the agent's brain.

/new (agentname) (purpose)
Create a new agent.

/run (agentname) (prompt)
Prompt an agent.

/edit (agentname) (newname) (newpurpose)
Edit an agent's name, purpose, or both.

/add (agentname)
After uploading files, send them to an agent.

/delete agent (agentname)
Delete an agent.

/delete context (agentname) (index)
Delete a specific context file from an agent.

/list
Generate a list of buttons for each agent. Click on a button to expand and view the purpose and context files of the agent.

/o (prompt) (agentnames)
Orchestrate agent(s) to accomplish a single task.

/help
Generate a list of all commands and their uses.

# how to use it

Create a .env file structured like this:

```
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=
```

Then, in the powershell terminal in VS Code (or whatever your IDE is), run the following:

```
cd (project name here)
node deploy-commands.js
node index.js
```

and then the bot should be online. Use Ctrl+C in the terminal to make your bot offline.

### Email gullyboyslok@gmail.com with any questions.
