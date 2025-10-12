const { 
    ApplicationCommandOptionType,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} = require('discord.js');
const Create = require('../../models/Create');

const mapPool = {
    'Futebrawl': ['Tiro de meta', 'Superpraia', 'Futebol ensolarado'],
    'Pique Gemas': ['Mina rochosa', 'Ilumina', 'Arapuca mortal'],
    'Nocaute': ['Rocha da Belle', 'Caverna do braço dourado', 'Novos horizontes'],
    'Roubo': ['Pit stop', 'Ravina kabum', 'Batata quente'],
    'Caça-Estrelas': ['Tocaia', 'Bolo em camadas', 'Estação seca'],
    'Zona Estratégica': ['Besouros brigões', 'Anel de fogo', 'Aberto'],
};

const mapImages = {
    'Tiro de meta': 'https://cdn.brawlify.com/maps/regular/15000026.png',
    'Superpraia': 'https://cdn.brawlify.com/maps/regular/15000051.png',
    'Futebol ensolarado': 'https://cdn.brawlify.com/maps/regular/15000144.png',
    'Mina rochosa': 'https://cdn.brawlify.com/maps/regular/15000007.png',
    'Ilumina': 'https://cdn.brawlify.com/maps/regular/15000011.png',
    'Arapuca mortal': 'https://cdn.brawlify.com/maps/regular/15000009.png',
    'Rocha da Belle': 'https://cdn.brawlify.com/maps/regular/15000368.png',
    'Caverna do braço dourado': 'https://cdn.brawlify.com/maps/regular/15000367.png',
    'Novos horizontes': 'https://cdn.brawlify.com/maps/regular/15000703.png',
    'Pit stop': 'https://cdn.brawlify.com/maps/regular/15000137.png',
    'Ravina kabum': 'https://cdn.brawlify.com/maps/regular/15000018.png',
    'Batata quente': 'https://cdn.brawlify.com/maps/regular/15000053.png',
    'Tocaia': 'https://cdn.brawlify.com/maps/regular/15000022.png',
    'Bolo em camadas': 'https://cdn.brawlify.com/maps/regular/15000082.png',
    'Estação seca': 'https://cdn.brawlify.com/maps/regular/15000083.png',
    'Besouros brigões': 'https://cdn.brawlify.com/maps/regular/15000306.png',
    'Anel de fogo': 'https://cdn.brawlify.com/maps/regular/15000300.png',
    'Aberto': 'https://cdn.brawlify.com/maps/regular/15000292.png'
};

const activeMatchChannels = require('../../data/activeMatchChannels');

function shuffleArray(array) {
    return array
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
}

module.exports = {
    name: 'match',
    description: 'Inicia uma partida entre dois times!',
    options: [
        {
            name: 'team1-captain',
            description: 'Capitão do 1o time',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'team2-captain',
            description: 'Capitão do 2o time',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    botPermissions: [PermissionFlagsBits.MoveMembers, PermissionFlagsBits.ManageChannels],

    callback: async (client, interaction) => {
        const ORGANIZADOR_ROLE_ID = '1295916462002802698';

        try {
            // Check if user has Organizador role
            if (!interaction.member.roles.cache.has(ORGANIZADOR_ROLE_ID)) {
                return interaction.reply({
                    content: 'Você não tem permissão para usar este comando.',
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            const guild = interaction.guild;
            const captain1 = interaction.options.getUser('team1-captain');
            const captain2 = interaction.options.getUser('team2-captain');

            const team1 = await Create.findOne({ captainId: captain1.id });
            const team2 = await Create.findOne({ captainId: captain2.id });

            if (!team1 || !team2) {
                return interaction.editReply({ content: 'Um ou ambos os times não existem.', ephemeral: true });
            }

            const team1PlayerIds = [team1.captainId, team1.playerTwoId, team1.playerThreeId];
            const team2PlayerIds = [team2.captainId, team2.playerTwoId, team2.playerThreeId];

            const SALA_DE_ESPERA_VC_ID = '1426737924438753310';
            const members1 = [];
            for (const id of team1PlayerIds) {
                const member = await guild.members.fetch(id).catch(() => null);
                if (member?.voice.channel?.id === SALA_DE_ESPERA_VC_ID) members1.push(member);
            }
            const members2 = [];
            for (const id of team2PlayerIds) {
                const member = await guild.members.fetch(id).catch(() => null);
                if (member?.voice.channel?.id === SALA_DE_ESPERA_VC_ID) members2.push(member);
            }

            if (members1.length === 0 || members2.length === 0) {
                return interaction.editReply({
                    content: 'Um ou ambos os times não têm membros em <#1426737924438753310>.',
                    ephemeral: true
                });
            }

            const gamemodeKeys = Object.keys(mapPool);
            const selectedGamemodes = shuffleArray(gamemodeKeys).slice(0, 5);
            const matchMaps = selectedGamemodes.map(mode => {
                const maps = mapPool[mode];
                const map = maps[Math.floor(Math.random() * maps.length)];
                return { mode, map };
            });

            const PARTIDAS_CATEGORY_ID = '1426737868205981807';
            const category = guild.channels.cache.get(PARTIDAS_CATEGORY_ID);
            if (!category) {
                return interaction.editReply({
                    content: 'Categoria "Partidas" não encontrada.',
                    ephemeral: true
                });
            }

            const ADMIN_ROLE_ID = '1295916595360567326';

            const vc1 = await guild.channels.create({
                name: `${team1.teamName}`,
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [
                    { id: guild.roles.everyone.id, deny: ['Connect'] },
                    { id: ADMIN_ROLE_ID, allow: ['Connect', 'ViewChannel', 'Speak'] },
                    ...members1.map(member => ({
                        id: member.id,
                        allow: ['Connect', 'ViewChannel', 'Speak'],
                    }))
                ]
            });

            const vc2 = await guild.channels.create({
                name: `${team2.teamName}`,
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [
                    { id: guild.roles.everyone.id, deny: ['Connect'] },
                    { id: ADMIN_ROLE_ID, allow: ['Connect', 'ViewChannel', 'Speak'] },
                    ...members2.map(member => ({
                        id: member.id,
                        allow: ['Connect', 'ViewChannel', 'Speak'],
                    }))
                ]
            });

            activeMatchChannels.add(vc1.id);
            activeMatchChannels.add(vc2.id);

            for (const member of members1) await member.voice.setChannel(vc1.id);
            for (const member of members2) await member.voice.setChannel(vc2.id);

            const embed = new EmbedBuilder()
                .setTitle(`CAMPEONATO BRAWL - Set 1`)
                .setDescription('Escolham o mapa e comecem a partida!')
                .addFields(
                    { name: team1.teamName, value: members1.map(m => `<@${m.id}>`).join('\n'), inline: true },
                    { name: team2.teamName, value: members2.map(m => `<@${m.id}>`).join('\n'), inline: true },
                    { name: 'Ordem:', value: matchMaps.map((m, i) => `**Set ${i+1}:** ${m.mode} - [${m.map}](${mapImages[m.map] || ''})`).join('\n') }
                )
                .setThumbnail(mapImages[matchMaps[0].map] || null)
                .setImage(mapImages[matchMaps[0].map] || null)
                .setColor(0x00FF00)
                .setTimestamp();

            const buttons = new ActionRowBuilder().addComponents(
                matchMaps.map((m, i) =>
                    new ButtonBuilder()
                        .setCustomId(`round_${i}`)
                        .setLabel(`Set ${i+1}`)
                        .setStyle(ButtonStyle.Primary)
                )
            );

            // Send public message
            const message = await interaction.followUp({
                content: null,
                embeds: [embed],
                components: [buttons],
                ephemeral: false
            });

            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 3600000,
            });

            collector.on('collect', async i => {
                collector.resetTimer();
                const roundIndex = parseInt(i.customId.split('_')[1]);
                const round = matchMaps[roundIndex];
                const newEmbed = EmbedBuilder.from(embed)
                    .setTitle(`CAMPEONATO BRAWL - Set ${roundIndex + 1}`)
                    .setImage(mapImages[round.map] || null);
                await i.update({ embeds: [newEmbed] });
            });

            await interaction.editReply({ content: 'Partida iniciada com sucesso!', ephemeral: true });

        } catch (error) {
            console.error('Match command error:', error);
            return interaction.reply({
                content: `Erro: ${error.message}. Contate <@icedragon235>.`,
                ephemeral: true
            });
        }
    },
    activeMatchChannels,
};
