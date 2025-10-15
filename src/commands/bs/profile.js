const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const Link = require('../../models/Link');

module.exports = {
    name: 'profile',
    description: 'Mostra as estatísticas da conta do Brawl de um usuário.',
    options: [
        {
            name: 'user',
            description: 'Usuário a visualizar (vazio p/ vc msm)',
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],

    callback: async (client, interaction) => {
        try {
            const user = interaction.options.getUser('user') || interaction.user;
            const linked = await Link.findOne({ discordId: user.id });

            // check before deferring reply — this ensures ephemeral messages actually stay private
            if (!linked) {
                return interaction.reply({
                    content: `<@${user.id}> não tem uma conta linkada.`,
                    ephemeral: true
                });
            }

            // now defer the reply publicly for the actual profile data
            await interaction.deferReply();

            const response = await fetch(
                `https://api.brawlstars.com/v1/players/%23${linked.brawlTag.replace(/^#/, '')}`,
                { headers: { Authorization: `Bearer ${process.env.BRAWL_API_TOKEN}` } }
            );

            if (!response.ok) {
                return interaction.followUp({
                    content: `Erro ao consultar a API do Brawl Stars (status ${response.status}).`,
                    ephemeral: true
                });
            }

            const data = await response.json();

            const calc = (won, lost) =>
                won + lost === 0 ? 0 : ((won / (won + lost)) * 100).toFixed(1);

            const embed = new EmbedBuilder()
                .setTitle(`<:bsaccount:1427326364440199249> ${data.name} (#${linked.brawlTag})`)
                .setColor(0x00AE86)
                .addFields(
                    { name: 'Troféus', value: `🏆 ${data.trophies}`, inline: true },
                    { name: 'Vitórias 3v3', value: `<:ranked:1427324585732210748> ${data['3vs3Victories'] || 0}`, inline: true },
                    { name: 'Vitórias Combate', value: `<:showdown_icon:1427326591922339850> ${data['soloVictories'] || 0}`, inline: true },
                    {
                        name: 'Winrate',
                        value: `<:duels_icon:1427326360736763995> ${calc(
                            data['3vs3Victories'] || 0,
                            (data['3vs3Games'] || 0) - (data['3vs3Victories'] || 0)
                        )}%`,
                        inline: true
                    }
                )
                .setThumbnail(data?.icon?.url || null)
                .setTimestamp();

            // this one is public
            return interaction.editReply({ embeds: [embed], ephemeral: false });

        } catch (error) {
            console.error('Profile command error:', error);
            return interaction.followUp({
                content: `Erro: ${error.message}. Contate <@icedragon235>.`,
                ephemeral: true
            });
        }
    }
};
