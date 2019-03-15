const commands = require('./core/commands.js');
const Discord = require("discord.js");
const client = new Discord.Client();

secretToken = 'NTIwODA1NDI2MjE2ODI4OTQw.DuzPMw.aQE88p-8VQgwJnPc6a5pbj6hHHM';
client.login(secretToken);

client.on('ready', () => {
  console.log('Cobb is connected and ready!');
  client.user.setActivity('You', {type: 'Listening'});
});

client.on('message', (message) => {
  if (message.author != client.user) {
    if (message.content.startsWith('!')) {
      commands.processCommand(message, client);
    }
  }
});

client.on('error', (err) => {
  console.error(err);
});
