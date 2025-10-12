const { 
    Client, 
    Interaction, 
    ApplicationCommandOptionType, 
    PermissionFlagsBits 
} = require('discord.js');
const Create = require('../../models/Create');

module.exports = {
    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply({ flags: 64 }); 

            const teamName = interaction.options.getString('team-name');
            const player1 = interaction.options.getUser('captain');
            const player2 = interaction.options.getUser('player2');
            const player3 = interaction.options.getUser('player3');

            const sameName = await Create.findOne({ teamName });
            if (sameName) {
                return interaction.editReply(`❌ A team named **${teamName}** already exists.`);
            }

            const inTeam = await Create.findOne({
                $or: [
                    { captainId: { $in: [player1.id, player2.id, player3.id] } },
                    { playerTwoId: { $in: [player1.id, player2.id, player3.id] } },
                    { playerThreeId: { $in: [player1.id, player2.id, player3.id] } },
                ],
            });

            if (inTeam) {
                return interaction.editReply(`⚠️ One or more of these users are already in another team!`);
            }

            const newTeam = await Create.create({
                guildId: interaction.guild.id,
                teamName,
                captainId: player1.id,
                playerTwoId: player2.id,
                playerThreeId: player3.id,
            });

            return interaction.editReply(`✅ Team **${teamName}** created successfully!`);
        } catch (error) {
            console.error(error);
            return interaction.editReply(`❌ An error occurred while creating the team.`);
        }
    },
    name: 'create',
    description: 'Creates a team!',
    options: [
        {
            name: 'team-name',
            description: 'The name of the team to be created',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'captain',
            description: 'The first member (and captain) of the team',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'player2',
            description: 'The second member of the team',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'player3',
            description: 'The third member of the team',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    botPermissions: [PermissionFlagsBits.ManageNicknames],
};
