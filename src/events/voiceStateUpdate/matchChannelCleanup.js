const activeMatchChannels = require('../../data/activeMatchChannels');

module.exports = (client, oldState, newState) => {
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    const channelsToCheck = [oldChannel, newChannel].filter(
        c => c && activeMatchChannels.has(c.id)
    );

    for (const channel of channelsToCheck) {
        if (channel.members.size === 0) {
            channel.delete()
                .then(() => {
                    activeMatchChannels.delete(channel.id);
                    console.log(`Deleted empty match channel: ${channel.name}`);
                })
                .catch(err => console.error(`Failed to delete channel ${channel.name}:`, err));
        }
    }
};
