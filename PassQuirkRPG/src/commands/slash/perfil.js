const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { OfficialEmbedBuilder, EMOJIS } = require('../../utils/embedStyles');
const { RACES, BASE_CLASSES } = require('../../data/passquirk-official-data');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Muestra tu perfil de personaje, estadísticas y progreso.'),
    async execute(interaction, client) {
        const userId = interaction.user.id;
        const targetUser = interaction.user;
        // Usar el GameManager para obtener datos reales
        const player = await client.gameManager.getPlayer(userId);

        if (!player) {
            await interaction.reply({ content: '❌ No tienes un personaje creado. Usa `/passquirkrpg` para comenzar.', ephemeral: true });
            return;
        }

        // Formatear datos usando data oficial
        let raceId = player.race;
        if (typeof raceId === 'object') raceId = raceId.name || 'humanos'; // Fallback si es objeto
        
        const normalizedRaceId = String(raceId).toLowerCase();
        let raceData = null;
        
        // Búsqueda insensible a mayúsculas en RACES
        const rKey = Object.keys(RACES).find(k => k.toLowerCase() === normalizedRaceId || k.toLowerCase().includes(normalizedRaceId));
        if (rKey) raceData = RACES[rKey];

        if (!raceData) {
            raceData = { name: 'Humano', emoji: '👤' };
        }
        
        let classId = player.class;
        if (typeof classId === 'object') classId = classId.name || 'Aventurero';

        const normalizedClassId = String(classId).toLowerCase();
        let classData = null;
        
        const cKey = Object.keys(BASE_CLASSES).find(k => k.toLowerCase() === normalizedClassId);
        if (cKey) classData = BASE_CLASSES[cKey];

        if (!classData) {
             classData = { emoji: '⚔️', name: classId || 'Aventurero' };
        }

        // Crear Embed de Perfil
        const embed = new OfficialEmbedBuilder()
            .setOfficialStyle('profile')
            .setOfficialTitle(`Perfil de ${interaction.user.username}`, EMOJIS.PROFILE) // Usar username de interacción
            .setOfficialDescription(
                `**Nivel ${player.level}** | ${raceData.emoji} ${raceData.name} | ${classData.emoji} ${classData.name}`
            )
            .setThumbnail(interaction.user.displayAvatarURL()) // Thumbnail del usuario de Discord
            .addOfficialField(`${EMOJIS.HP} Salud`, `${Math.floor(player.stats.hp)}/${Math.floor(player.stats.maxHp)}`, true)
            .addOfficialField(`${EMOJIS.MP} Energía`, `${Math.floor(player.stats.mp)}/${Math.floor(player.stats.maxMp)}`, true)
            .addOfficialField(`${EMOJIS.ATTACK} Ataque`, `${player.stats.attack}`, true)
            .addOfficialField(`${EMOJIS.DEFENSE} Defensa`, `${player.stats.defense}`, true)
            .addOfficialField(`${EMOJIS.SPEED} Velocidad`, `${player.stats.speed}`, true)
            .addOfficialField(`🌀 Quirk`, `${classData.name}`, true) // Nombre de la clase como "Quirk"
            
            .addOfficialField(`${EMOJIS.ECONOMY} Economía`, `**PassCoins:** ${player.gold}`, false) // Solo PassCoins, sin gemas
            
            .addOfficialField(`📍 Ubicación`, `${player.currentZone || 'Desconocida'}`, true) // Ubicación real
            .addOfficialField(`📅 Registrado`, `<t:${Math.floor(new Date(player.createdAt).getTime() / 1000)}:R>`, true);

        // Botones interactivos
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('profile_inventory')
                    .setLabel('Inventario')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎒'),
                new ButtonBuilder()
                    .setCustomId('profile_skills')
                    .setLabel('Habilidades')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⚡'),
                new ButtonBuilder()
                    .setCustomId('profile_achievements')
                    .setLabel('Logros')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏆')
            );

        const replyOptions = { embeds: [embed.getEmbed()], components: [row] };

        // Manejar si es respuesta o actualización
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(replyOptions);
        } else {
            await interaction.reply(replyOptions);
        }
    },

    async handleInteraction(interaction, client) {
        const id = interaction.customId;

        if (id === 'profile_inventory') {
            const inventoryCmd = client.commands.get('inventario');
            if (inventoryCmd) {
                await inventoryCmd.execute(interaction, client);
            } else {
                await interaction.reply({ content: '⚠️ El sistema de inventario aún no está disponible.', ephemeral: true });
            }
        } else if (id === 'profile_skills' || id === 'profile_achievements') {
            await interaction.reply({ content: '🛠️ Esta función estará disponible próximamente.', ephemeral: true });
        }
    }
};
