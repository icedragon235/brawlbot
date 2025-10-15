const { 
    Client, 
    Interaction, 
    ApplicationCommandOptionType, 
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');
const Create = require('../../models/Create');

module.exports = {
    name: 'create',
    description: 'Cria um time!',
    options: [
        {
            name: 'team-name',
            description: 'O nome do time',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'captain',
            description: 'O 1o membro (e capitão) do time',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'player2',
            description: 'O 2o membro do time',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'player3',
            description: 'O 3o membro do time',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    botPermissions: [PermissionFlagsBits.ManageNicknames],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const LOG_CHANNEL_ID = '1296125372533837977'; // logs-admin channel ID

        try {
            await interaction.deferReply({ ephemeral: true });

            const teamName = interaction.options.getString('team-name');
            const player1 = interaction.options.getUser('captain');
            const player2 = interaction.options.getUser('player2');
            const player3 = interaction.options.getUser('player3');

            // Check if team name already exists
            const sameName = await Create.findOne({ teamName });
            if (sameName) {
                return interaction.editReply({
                    content: `Um time nomeado **${teamName}** já existe.`,
                    ephemeral: true
                });
            }

            // Check if any of the users are already in a team
            const inTeam = await Create.findOne({
                $or: [
                    { captainId: { $in: [player1.id, player2.id, player3.id] } },
                    { playerTwoId: { $in: [player1.id, player2.id, player3.id] } },
                    { playerThreeId: { $in: [player1.id, player2.id, player3.id] } },
                ],
            });

            if (inTeam) {
                return interaction.editReply({
                    content: `Um ou mais desses usuários já estão em um time!`,
                    ephemeral: true
                });
            }

            // Create the team
            const newTeam = await Create.create({
                guildId: interaction.guild.id,
                teamName,
                captainId: player1.id,
                playerTwoId: player2.id,
                playerThreeId: player3.id,
            });

            // Log embed for #logs-admin
            const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('Time criado')
                    .setColor(0x00b300)
                    .addFields(
                        { name: 'Nome', value: teamName, inline: true },
                        { name: 'Capitão', value: `<@${player1.id}>`, inline: true },
                        { name: 'Jogador 2', value: `<@${player2.id}>`, inline: true },
                        { name: 'Jogador 3', value: `<@${player3.id}>`, inline: true },
                        { name: 'Criado por', value: `<@${interaction.user.id}>`, inline: true },
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }

            return interaction.editReply({
                content: `Time **${teamName}** criado!`,
                ephemeral: true
            });

        } catch (error) {
            console.error(error);
            return interaction.editReply({
                content: `Erro: ${error.message}. Contate <@icedragon235>.`,
                ephemeral: true
            });
        }
    },
};
