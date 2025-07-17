// deploy-commands.js
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.DISCORD_TOKEN;

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Registering slash commands (guild-only)...');

    // This deletes and replaces all guild commands with this list
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    /*
    // For global commands (takes ~1 hour to update), comment above and uncomment below:
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );
    */

    console.log('Successfully registered commands.');
  } catch (error) {
    console.error(error);
  }
})();
