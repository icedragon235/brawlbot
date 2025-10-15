const { 
    ApplicationCommandOptionType, 
    EmbedBuilder 
} = require('discord.js');
const Link = require('../../models/Link');

module.exports = {
    name: 'link',
    description: 'Linka ou deslinka seu usuário do Discord à uma conta do Brawl.',
    options: [
        {
            name: 'tag',
            description: 'Sua tag no Brawl Stars. Deixe vazio para deslinkar.',
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],

    callback: async (client, interaction) => {
        const LOG_CHANNEL_ID = '1296125372533837977'; // #logs channel

        try {
            await interaction.deferReply({ ephemeral: true });

            const tagInput = interaction.options.getString('tag');
            const discordId = interaction.user.id;

            if (!tagInput) {
                // Unlink account
                const existingLink = await Link.findOne({ discordId });
                if (!existingLink) {
                    return interaction.editReply({ 
                        content: `Você não tem uma conta linkada para deslinkar.`,
                        ephemeral: true
                    });
                }

                await Link.deleteOne({ discordId });

                // Log unlinked
                const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Conta Deslinkada')
                        .setColor(0xFF4D4D)
                        .addFields(
                            { name: 'Usuário', value: `<@${discordId}>`, inline: true },
                            { name: 'Tag Anterior', value: `#${existingLink.brawlTag}`, inline: true }
                        )
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] });
                }

                return interaction.editReply({ 
                    content: `Sua conta do Brawl foi deslinkada.`,
                    ephemeral: true
                });
            }

            const tag = tagInput.replace(/^#/, '');

            // Check if the tag is linked to someone else
            const existingTag = await Link.findOne({ brawlTag: tag });
            if (existingTag && existingTag.discordId !== discordId) {
                return interaction.editReply({ 
                    content: `O usuário de Brawl **#${tag}** já foi registrado à outra pessoa.`,
                    ephemeral: true
                });
            }

            // Force link / overwrite
            await Link.findOneAndUpdate(
                { discordId }, 
                { brawlTag: tag, discordId }, 
                { upsert: true }
            );

            // Log linking
            const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Conta Linkada/Atualizada')
                    .setColor(0x00AE86)
                    .addFields(
                        { name: 'Discord User', value: `<@${discordId}>`, inline: true },
                        { name: 'Brawl Tag', value: `#${tag}`, inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }

            return interaction.editReply({
                content: `Sua conta do discord foi linkada ao usuário do Brawl **#${tag}**.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Link command error:', error);
            await interaction.editReply({
                content: `Erro: ${error.message}. Contate <@icedragon235>`,
                ephemeral: true
            });
        }
    }
};
