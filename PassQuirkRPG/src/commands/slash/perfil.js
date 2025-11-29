const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { OfficialEmbedBuilder, EMOJIS } = require('../../utils/embedStyles');
const { RACES, BASE_CLASSES } = require('../../data/passquirk-official-data');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Muestra tu perfil de personaje, estadísticas y progreso.')
        .addSubcommand(subcommand => 
            subcommand
                .setName('ver')
                .setDescription('Muestra tu perfil actual'))
        .addSubcommand(subcommand => 
            subcommand
                .setName('setavatar')
                .setDescription('Actualiza la imagen de tu personaje')
                .addAttachmentOption(option => option.setName('imagen').setDescription('La nueva imagen para tu perfil').setRequired(true))),
    async execute(interaction, client) {
        const userId = interaction.user.id;
        const subcommand = interaction.options.getSubcommand(false) || 'ver'; // Default 'ver' for root command usage (if not strict)

        // Usar el GameManager para obtener datos reales
        const player = await client.gameManager.getPlayer(userId);

        if (!player) {
            await interaction.reply({ content: '❌ No tienes un personaje creado. Usa `/passquirkrpg` para comenzar.', ephemeral: true });
            return;
        }

        if (subcommand === 'setavatar') {
            const attachment = interaction.options.getAttachment('imagen');
            if (!attachment) {
                await interaction.reply({ content: '❌ Debes adjuntar una imagen.', ephemeral: true });
                return;
            }

            if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
                await interaction.reply({ content: '❌ El archivo debe ser una imagen (PNG, JPG, GIF).', ephemeral: true });
                return;
            }

            await interaction.deferReply({ ephemeral: true });

            try {
                const playerDB = client.gameManager.playerDB; // Acceso directo si es posible, o getPlayerDB helper
                // Si no podemos acceder a uploadUserAvatar directamente desde player object, usamos el DB manager
                
                // Intentar subir a Supabase
                if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
                    const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
                    const buffer = Buffer.from(response.data, 'binary');
                    const filename = attachment.name || `avatar_${Date.now()}.png`;
                    
                    const finalUrl = await playerDB.uploadUserAvatar(userId, buffer, filename, attachment.contentType);
                    player.profileIcon = finalUrl;
                    player.avatar_url = finalUrl; // Sync both fields
                } else {
                    // Fallback local (solo guarda URL)
                    player.profileIcon = attachment.url;
                }
                
                await client.gameManager.playerDB.savePlayer(player);
                
                await interaction.editReply({ content: `✅ Imagen de perfil actualizada correctamente.\n[Ver nueva imagen](${player.profileIcon})` });
            } catch (error) {
                console.error('Error actualizando avatar:', error);
                await interaction.editReply({ content: '❌ Ocurrió un error al actualizar la imagen. Intenta nuevamente.' });
            }
            return;
        }

        // Lógica de 'ver' (o default)
        const targetUser = interaction.user;
        
        // Formatear datos usando data oficial
        let raceId = player.race;
        if (typeof raceId === 'object') raceId = raceId.name || 'humanos'; // Fallback si es objeto
        
        const normalizedRaceId = String(raceId).toLowerCase();
        let raceData = null;
        
        // Búsqueda insensible a mayúsculas en RACES
        const rKey = Object.keys(RACES).find(k => k.toLowerCase() === normalizedRaceId || k.toLowerCase().includes(normalizedRaceId));
        if (rKey) raceData = RACES[rKey];

        if (!raceData) {
            raceData = { name: typeof raceId === 'string' ? raceId.charAt(0).toUpperCase() + raceId.slice(1) : 'Humano', emoji: '👤' };
        }
        
        let classId = player.class;
        if (typeof classId === 'object') classId = classId.name || classId.id || 'Aventurero';

        const normalizedClassId = String(classId).toLowerCase().replace(/\s+/g, '_'); // Normalizar espacios a guiones bajos para coincidir con claves
        let classData = null;
        
        // Intentar buscar en BASE_CLASSES
        const cKey = Object.keys(BASE_CLASSES).find(k => k.toLowerCase().replace(/\s+/g, '_') === normalizedClassId);
        if (cKey) {
            // BASE_CLASSES no tiene propiedad 'name' dentro, usamos la clave formateada
            // Convertir "ALMA NACIENTE" -> "Alma Naciente"
            const formattedName = cKey.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
            classData = { ...BASE_CLASSES[cKey], name: formattedName };
        }

        if (!classData) {
             // Si no encuentra datos, formatear el string bonito (quitar guiones bajos, capitalizar)
             const prettyName = String(classId || 'Aventurero').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
             classData = { emoji: '⚔️', name: prettyName };
        }

        // Obtener ubicación real o fallback
        let location = player.currentZone;
        if (!location && player.exploration && player.exploration.currentZone) {
            location = player.exploration.currentZone;
        }
        // Si no hay zona o es una clave genérica, intentar formatear o usar Space Central
        if (!location || location === 'unknown') location = 'Space Central'; 

        // Normalizar nombres de ubicación si es necesario
        // Formato esperado: "Mayoi - Bosque Inicial" o "Space Central"
        if (location === 'bosque_inicial') location = 'Mayoi - Bosque Inicial';
        // Si es una clave simple, formatear a Title Case
        if (location && /^[a-z0-9_]+$/.test(location)) {
            location = location.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        // Si el nombre no contiene guiones o espacios complejos, asegurar formato Space Central
        if (location === 'Space Central' || location === 'space_central') location = 'Space Central';

        // PassCoins emoji
        const passCoinEmoji = EMOJIS.GOLD || '💰';
        const goldAmount = player.gold !== undefined ? player.gold : (player.inventory?.gold || 0);

        // Verificar imagen de perfil (Prioridad: player.profileIcon > player.avatar_url > discord)
        // Nota: profileIcon debería guardar la URL personalizada subida.
        const profileImage = player.profileIcon || player.avatar_url || interaction.user.displayAvatarURL();

        // Cálculos previos
        const currentXp = player.xp || 0;
        const nextLevelXp = client.gameManager.systems.level.calculateXpForNextLevel(player.level);
        
        const embed = new OfficialEmbedBuilder()
            .setOfficialStyle('profile')
            .setTitle(`Perfil de ${player.username}`)
            .setThumbnail(profileImage) // Usar la imagen resuelta arriba
            .setOfficialDescription(
                `**Nivel ${player.level}** | ${raceData.emoji} **${raceData.name}** | ${classData.emoji} **${classData.name}**`
            )
            .addOfficialField(`${EMOJIS.HP} Salud`, `\`${player.stats.hp}/${player.stats.maxHp}\``, true)
            .addOfficialField(`${EMOJIS.MP} Energía`, `\`${player.stats.mp}/${player.stats.maxMp}\``, true)
            .addOfficialField(`${EMOJIS.ATTACK} Ataque`, `\`${player.stats.attack}\``, true)
            .addOfficialField(`${EMOJIS.DEFENSE} Defensa`, `\`${player.stats.defense}\``, true)
            .addOfficialField(`${EMOJIS.SPEED || '👟'} Velocidad`, `\`${player.stats.speed}\``, true)
            .addOfficialField(`🌀 Quirk`, `\`${player.quirk || 'Ninguno'}\``, true)
            
            .addOfficialField(`PassCoins`, `\`${goldAmount}\` ${passCoinEmoji}`, false)
            
            .addOfficialField(
                `Nivel ${player.level}`, 
                `${client.gameManager.systems.level.generateProgressBar(currentXp, nextLevelXp, 15)}`, 
                false
            )

            .addOfficialField(`📍 Ubicación`, `${location}`, true)
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
                    .setEmoji('⚡')
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
            // Diferir actualización para que el inventario reemplace el mensaje actual
            if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
            
            const inventoryCmd = client.commands.get('inventario');
            if (inventoryCmd) {
                await inventoryCmd.execute(interaction, client);
            } else {
                await interaction.followUp({ content: '⚠️ El sistema de inventario aún no está disponible.', ephemeral: true });
            }
        } else if (id === 'character_profile') {
            // Volver al perfil desde el inventario u otros menús
            if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
            await this.execute(interaction, client);
        } else if (id === 'profile_skills') {
            // Mostrar habilidades y quirks
            const player = await client.gameManager.getPlayer(interaction.user.id);
            if (!player) return;

            const embed = new OfficialEmbedBuilder()
                .setOfficialStyle('profile')
                .setOfficialTitle(`Habilidades de ${player.username}`, '⚡')
                .setOfficialDescription('Aquí se muestran tus quirks, habilidades de clase y equipo activo.');

            // Quirk
            const quirkName = player.quirk && player.quirk !== 'Ninguno' ? player.quirk : 'Sin despertar';
            embed.addOfficialField('🌀 Quirk', quirkName, false);

            // Habilidades de Clase
            let classId = player.class;
            if (typeof classId === 'object') classId = classId.name || classId.id || 'aventurero';
            
            const { BASE_CLASSES } = require('../../data/passquirk-official-data');
            const normalizedClassId = String(classId).toLowerCase();
            let classData = null;
            const cKey = Object.keys(BASE_CLASSES).find(k => k.toLowerCase() === normalizedClassId || k.toLowerCase().replace(/\s+/g, '_') === normalizedClassId);
            if (cKey) classData = BASE_CLASSES[cKey];

            let skillsText = "No tienes habilidades aprendidas.";
            
            // Si tiene habilidades en DB, usarlas
            if (player.abilities && player.abilities.length > 0) {
                skillsText = player.abilities.map(skill => `**• ${skill.name}**: ${skill.description || 'Sin descripción'}`).join('\n');
            } 
            // Si no, mostrar habilidades base de la clase si existe
            else if (classData && classData.abilities) {
                // Convertir objeto de habilidades a texto legible
                // Suponiendo estructura { skill1: { name: ... }, skill2: { name: ... } } o array
                if (Array.isArray(classData.abilities)) {
                     skillsText = classData.abilities.map(s => `**• ${s.name}**`).join('\n');
                } else {
                     skillsText = Object.values(classData.abilities).map(s => `**• ${s.name}**`).join('\n');
                }
            } else {
                skillsText = "No se encontraron habilidades para tu clase actual.";
            }

            embed.addOfficialField('⚔️ Habilidades de Clase', skillsText, false);

            // Añadir menú de selección si hay habilidades para inspeccionar (Placeholder funcional)
            // ...


            // Botón volver
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('character_profile')
                    .setLabel('Volver al Perfil')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👤')
            );

            await interaction.update({ embeds: [embed.getEmbed()], components: [row] });
        } else if (id === 'profile_achievements') {
            await interaction.reply({ content: '🛠️ Esta función estará disponible próximamente.', ephemeral: true });
        }
    }
};
