const {
  ApplicationCommandOptionType,
  EmbedBuilder
} = require('discord.js');
const Create = require('../../models/Create');
const Link = require('../../models/Link');

module.exports = {
  name: 'team',
  description: 'Exibe informações sobre um time.',
  options: [
    {
      name: 'user',
      description: 'Um membro do time (deixe vazio para você mesmo)',
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],

  callback: async (client, interaction) => {
    try {
      const user = interaction.options.getUser('user') || interaction.user;

      // 🔍 Find the team by any of the 3 player IDs
      const team = await Create.findOne({
        $or: [
          { captainId: user.id },
          { playerTwoId: user.id },
          { playerThreeId: user.id }
        ]
      });

      // ⚠️ No team found — private message
      if (!team) {
        return interaction.reply({
          content: `<@${user.id}> não está em um time.`,
          ephemeral: true
        });
      }

      // ✅ Team found — public reply
      await interaction.deferReply();

      const calc = (won, lost) =>
        won + lost === 0 ? 0 : ((won / (won + lost)) * 100).toFixed(1);

      // Fetch Brawl Stars trophies for each team member
      const members = [team.captainId, team.playerTwoId, team.playerThreeId];
      const trophyData = await Promise.all(members.map(async (id) => {
        const linked = await Link.findOne({ discordId: id });
        if (!linked) return { id, trophies: '❌ Não linkado' };
        try {
          const res = await fetch(
            `https://api.brawlstars.com/v1/players/%23${linked.brawlTag.replace(/^#/, '')}`,
            { headers: { Authorization: `Bearer ${process.env.BRAWL_API_TOKEN}` } }
          );
          if (!res.ok) throw new Error(`API ${res.status}`);
          const data = await res.json();
          return { id, trophies: data.trophies };
        } catch {
          return { id, trophies: '❌ Erro' };
        }
      }));

      const embed = new EmbedBuilder()
        .setTitle(`${team.teamName}`)
        .setColor(0x00AE86)
        .addFields(
          { name: 'Capitão', value: `<@${team.captainId}>\n🏆 ${trophyData[0].trophies}`, inline: true },
          { name: 'Jogador 2', value: `<@${team.playerTwoId}>\n🏆 ${trophyData[1].trophies}`, inline: true },
          { name: 'Jogador 3', value: `<@${team.playerThreeId}>\n🏆 ${trophyData[2].trophies}`, inline: true },
          { name: '\u200B', value: '\u200B' },
          { name: 'Partidas', value: `${team.roundsWon}W / ${team.roundsLost}L (${calc(team.roundsWon, team.roundsLost)}%)`, inline: true },
          { name: 'Sets', value: `${team.setsWon}W / ${team.setsLost}L (${calc(team.setsWon, team.setsLost)}%)`, inline: true },
          { name: 'Embates', value: `${team.matchesWon}W / ${team.matchesLost}L (${calc(team.matchesWon, team.matchesLost)}%)`, inline: true }
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], ephemeral: false });

    } catch (error) {
      console.error('Team command error:', error);
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp({
          content: `Erro: ${error.message}. Contate <@icedragon235>.`,
          ephemeral: true
        });
      } else {
        return interaction.reply({
          content: `Erro: ${error.message}. Contate <@icedragon235>.`,
          ephemeral: true
        });
      }
    }
  }
};
