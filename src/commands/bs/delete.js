const { 
    Client, 
    Interaction, 
    PermissionFlagsBits,
    ApplicationCommandOptionType
} = require('discord.js');
const Create = require('../../models/Create');

module.exports = {
    name: 'delete',
    description: 'Deletes a team.',
    options: [
        {
            name: 'team-captain',
            description: 'The team captain of the team to be deleted (default is you)',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    botPermissions: [PermissionFlagsBits.ManageNicknames],

    callback: async (client, interaction) => {
        const ADMIN_ROLE_ID = '1295916595360567326'; // replace with your actual admin role ID

        try {
            await interaction.deferReply({ flags: 64 });

            // Target user = optional field or the user themselves
            const targetUser = interaction.options.getUser('team-captain') || interaction.user;
            const targetId = targetUser.id;

            // Find the team where this target user is captain
            const team = await Create.findOne({ captainId: targetId });

            if (!team) {
                return interaction.editReply(`❌ No team found under **${targetUser.username}**.`);
            }

            const isCaptain = team.captainId === interaction.user.id;
            const isAdmin = interaction.member.roles.cache.has(ADMIN_ROLE_ID);

            // Only allow deletion if:
            // - you are the captain of the team (and target is yourself)
            // - OR you are an admin (can delete anyone's team)
            if ((isCaptain && targetId === interaction.user.id) || isAdmin) {
                await Create.deleteOne({ _id: team._id });
                return interaction.editReply(`✅ Successfully deleted the team **${team.teamName}**!`);
            } else {
                return interaction.editReply(`❌ You don’t have permission to delete this team.`);
            }
        } catch (error) {
            console.error('Delete team error:', error);
            await interaction.editReply(`❌ An unexpected error occurred: ${error.message}`);
        }
    },
};
