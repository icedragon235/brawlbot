module.exports = {
  name: 'ping',
  description: 'Quick reply to check the state of brawlBot.',
  // devOnly: Boolean,
  testOnly: true,
  // options: Object[],
  // deleted: Boolean,

  callback: async (client, interaction) => {
    await interaction.deferReply();

    const reply = await interaction.fetchReply();
    const ping = reply.createdTimestamp - interaction.createdTimestamp;
    interaction.editReply(`Pong! Client: ${ping}ms | Websocket: ${client.ws.ping}ms`);
  },
};