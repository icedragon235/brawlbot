const matchCommand = require('../../commands/bs/match'); // adjust path if needed

module.exports = (client, oldState, newState) => {
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    const channelsToCheck = [oldChannel, newChannel].filter(
        c => c && matchCommand.activeMatchChannels.has(c.id)
    );

    for (const channel of channelsToCheck) {
        if (channel.members.size === 0) {
            channel.delete()
                .then(() => {
                    matchCommand.activeMatchChannels.delete(channel.id);
                    console.log(`Deleted empty match channel: ${channel.name}`);
                })
                .catch(err => console.error(`Failed to delete channel ${channel.name}:`, err));
        }
    }
};
