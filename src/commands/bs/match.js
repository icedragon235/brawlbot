const { 
    ApplicationCommandOptionType,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');
const Create = require('../../models/Create');

const mapPool = {
    'Capture the Flag': ['Dust Arena', 'Snowfield', 'Urban Combat'],
    'Team Deathmatch': ['Factory', 'Ravine', 'Harbor'],
    'King of the Hill': ['Fortress', 'Highlands', 'Citadel']
};

// Keep track of match channels for automatic cleanup
const activeMatchChannels = new Set();

module.exports = {
    name: 'match',
    description: 'Starts a match between two teams!',
    options: [
        {
            name: 'team1-captain',
            description: 'Captain of the first team',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'team2-captain',
            description: 'Captain of the second team',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    botPermissions: [PermissionFlagsBits.MoveMembers, PermissionFlagsBits.ManageChannels],

    callback: async (client, interaction) => {
        try {
            await interaction.deferReply({ flags: 64 });

            const guild = interaction.guild;
            const captain1 = interaction.options.getUser('team1-captain');
            const captain2 = interaction.options.getUser('team2-captain');

            // Fetch teams from DB
            const team1 = await Create.findOne({ captainId: captain1.id });
            const team2 = await Create.findOne({ captainId: captain2.id });

            if (!team1 || !team2) {
                return interaction.editReply('❌ One or both teams do not exist.');
            }

            const team1PlayerIds = [team1.playerOneId, team1.playerTwoId, team1.playerThreeId];
            const team2PlayerIds = [team2.playerOneId, team2.playerTwoId, team2.playerThreeId];

            // Define Sala de Espera VC
            const SALA_DE_ESPERA_VC_ID = 'YOUR_SALA_DE_ESPERA_VC_ID';

            // Fetch guild members in Sala de Espera
            const members1 = [];
            for (const id of team1PlayerIds) {
                const member = await guild.members.fetch(id).catch(() => null);
                if (member && member.voice.channel?.id === SALA_DE_ESPERA_VC_ID) members1.push(member);
            }

            const members2 = [];
            for (const id of team2PlayerIds) {
                const member = await guild.members.fetch(id).catch(() => null);
                if (member && member.voice.channel?.id === SALA_DE_ESPERA_VC_ID) members2.push(member);
            }

            if (members1.length === 0 || members2.length === 0) {
                return interaction.editReply('❌ One or both teams have no members currently in Sala de Espera VC.');
            }

            // Random gamemode and map selection
            const gamemodeKeys = Object.keys(mapPool);
            const gamemode = gamemodeKeys[Math.floor(Math.random() * gamemodeKeys.length)];
            const map = mapPool[gamemode][Math.floor(Math.random() * mapPool[gamemode].length)];

            // Partidas category
            const PARTIDAS_CATEGORY_ID = 'YOUR_PARTIDAS_CATEGORY_ID';
            const category = guild.channels.cache.get(PARTIDAS_CATEGORY_ID);
            if (!category) return interaction.editReply('❌ Partidas category not found.');

            // Create VCs
            const vc1 = await guild.channels.create({
                name: `${team1.teamName} - ${gamemode} - ${map}`,
                type: ChannelType.GuildVoice,
                parent: category.id
            });
            const vc2 = await guild.channels.create({
                name: `${team2.teamName} - ${gamemode} - ${map}`,
                type: ChannelType.GuildVoice,
                parent: category.id
            });

            activeMatchChannels.add(vc1.id);
            activeMatchChannels.add(vc2.id);

            // Move members
            for (const member of members1) await member.voice.setChannel(vc1.id);
            for (const member of members2) await member.voice.setChannel(vc2.id);

            // Reply with match info
            await interaction.editReply(
                `🎮 Match started!\n` +
                `Team 1: ${members1.map(m => m.user.tag).join(', ')}\n` +
                `Team 2: ${members2.map(m => m.user.tag).join(', ')}\n` +
                `Gamemode: ${gamemode}\n` +
                `Map: ${map}`
            );

        } catch (error) {
            console.error('Match command error:', error);
            await interaction.editReply(`❌ An error occurred: ${error.message}`);
        }
    },
    activeMatchChannels, // export so main bot file can use for cleanup
};
