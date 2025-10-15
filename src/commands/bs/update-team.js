const { 
  ApplicationCommandOptionType, 
  PermissionFlagsBits, 
  EmbedBuilder 
} = require('discord.js');
const Create = require('../../models/Create');

module.exports = {
  name: 'update-team',
  description: 'Atualiza estatísticas de um time manualmente (Organizadores apenas).',
  options: [
    {
      name: 'captain',
      description: 'Capitão do time a ser atualizado',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'category',
      description: 'O que atualizar (rounds, sets, matches)',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: 'Rounds', value: 'rounds' },
        { name: 'Sets', value: 'sets' },
        { name: 'Matches', value: 'matches' },
      ],
    },
    {
      name: 'result',
      description: 'Vitória ou derrota?',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: 'Vitória', value: 'win' },
        { name: 'Derrota', value: 'loss' },
      ],
    },
  ],

  botPermissions: [PermissionFlagsBits.ManageGuild],

  callback: async (client, interaction) => {
    const ORGANIZADOR_ROLE_ID = '1295916462002802698';
    const LOG_CHANNEL_ID = '1296125372533837977';

    try {
      // Only organizers
      if (!interaction.member.roles.cache.has(ORGANIZADOR_ROLE_ID)) {
        return interaction.reply({
          content: 'Você não tem permissão para usar este comando.',
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const captain = interaction.options.getUser('captain');
      const category = interaction.options.getString('category');
      const result = interaction.options.getString('result');

      const team = await Create.findOne({ captainId: captain.id });
      if (!team) {
        return interaction.editReply({ 
          content: `Nenhum time encontrado sob o capitão <@${captain.id}>.`,
          ephemeral: true
        });
      }

      // Update proper field
      const field = `${category}${result === 'win' ? 'Won' : 'Lost'}`;
      team[field] += 1;
      await team.save();

      // Log update
      const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('Estatísticas de time atualizadas')
          .setColor(result === 'win' ? 0x00ff00 : 0xff0000)
          .addFields(
            { name: 'Time', value: team.teamName, inline: true },
            { name: 'Categoria', value: category, inline: true },
            { name: 'Resultado', value: result === 'win' ? 'Vitória' : 'Derrota', inline: true },
            { name: 'Atualizado por', value: `<@${interaction.user.id}>`, inline: true },
          )
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }

      await interaction.editReply({
        content: `Atualizado com sucesso: **${team.teamName}** → ${category} ${result === 'win' ? 'VITÓRIA' : 'DERROTA'}.`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Update team error:', error);
      await interaction.editReply({
        content: `Erro: ${error.message}. Contate <@icedragon235>.`,
        ephemeral: true
      });
    }
  }
};
