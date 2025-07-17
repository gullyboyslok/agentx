// utils/contextManager.js
const fs = require('fs');
const path = require('path');
const CONTEXT_PATH = path.join(__dirname, '..', 'agent_context.json');
const MAX_MESSAGES = 150;

function loadContext() {
  if (!fs.existsSync(CONTEXT_PATH)) return {};
  return JSON.parse(fs.readFileSync(CONTEXT_PATH, 'utf8'));
}

function saveContext(data) {
  fs.writeFileSync(CONTEXT_PATH, JSON.stringify(data, null, 2));
}

function getContext(guildId, agentName) {
  const data = loadContext();
  const key = `${guildId}-${agentName}`;
  return data[key] || [];
}

function addMessage(guildId, agentName, role, content) {
  const data = loadContext();
  const key = `${guildId}-${agentName}`;
  if (!data[key]) data[key] = [];

  data[key].push({ role, content });
  if (data[key].length > MAX_MESSAGES) {
    data[key] = data[key].slice(-MAX_MESSAGES);
  }

  saveContext(data);
}

module.exports = {
  getContext,
  addMessage
};
