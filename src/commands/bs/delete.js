const { 
    Client, 
    Interaction, 
    PermissionFlagsBits,
    ApplicationCommandOptionType,
    EmbedBuilder
} = require('discord.js');
const Create = require('../../models/Create');

module.exports = {
    name: 'delete',
    description: 'Deleta um time.',
    options: [
        {
            name: 'team-captain',
            description: 'O capitão do time a ser deletado.',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    botPermissions: [PermissionFlagsBits.ManageNicknames],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const ORGANIZADOR_ROLE_ID = '1295916462002802698'; // Organizador role
        const ADMIN_ROLE_ID = '1295916595360567326'; // Admin role
        const LOG_CHANNEL_ID = '1296125372533837977'; // logs-admin channel

        try {
            await interaction.deferReply({ ephemeral: true });

            const targetUser = interaction.options.getUser('team-captain') || interaction.user;
            const targetId = targetUser.id;

            // Find the team where this target user is captain
            const team = await Create.findOne({ captainId: targetId });

            if (!team) {
                return interaction.editReply({
                    content: `Nenhum time encontrado sob o capitão <@${targetUser.id}>.`,
                    ephemeral: true
                });
            }

            const isCaptain = team.captainId === interaction.user.id;
            const isAdmin = interaction.member.roles.cache.has(ADMIN_ROLE_ID);
            const isOrganizador = interaction.member.roles.cache.has(ORGANIZADOR_ROLE_ID);

            // Permission logic:
            // - Captain can delete their own team
            // - Admins or Organizadores can delete any team
            if (isCaptain || isAdmin || isOrganizador) {
                await Create.deleteOne({ _id: team._id });

                // Log deletion
                const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Time Deletado')
                        .setColor(0xff4d4d)
                        .addFields(
                            { name: 'Nome', value: team.teamName, inline: true },
                            { name: 'Capitão', value: `<@${targetUser.id}>`, inline: true },
                            { name: 'Deletado por', value: `<@${interaction.user.id}>`, inline: true }
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }

                return interaction.editReply({
                    content: `O time **${team.teamName}** do capitão <@${targetUser.id}> foi deletado com sucesso.`,
                    ephemeral: true
                });
            } else {
                return interaction.editReply({
                    content: `Você não tem permissão para deletar este time.`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Delete team error:', error);
            await interaction.editReply({
                content: `Erro: ${error.message}. Contate <@icedragon235>.`,
                ephemeral: true
            });
        }
    },
};
