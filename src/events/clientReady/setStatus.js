const {ActivityType} = require('discord.js');
module.exports = (client) => {
        client.user.setActivity({
        name: `${client.guilds.cache.get(process.env.GUILD_ID).name}`,
        type: ActivityType.Watching,
    });
};