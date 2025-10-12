require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});


( async() => {
  try{
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to Database');

  eventHandler(client);

  client.login(process.env.TOKEN);
  
  } catch (error) {
    console.log(`Error: ${error}`);
  }
})();

// const { REST, Routes } = require('discord.js');

// const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// (async () => {
//     try {
//         console.log('Deleting all guild commands...');
//         await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] });
//         console.log('All guild commands deleted!');
//     } catch (error) {
//         console.error(error);
//     }
// })();