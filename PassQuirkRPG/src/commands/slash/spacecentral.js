const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const musicManager = require('../../../bot/utils/musicManager');
const path = require('path');
const fs = require('fs');
const { getEmoji } = require('../../../bot/utils/emojiManager');

// --- CONFIGURACIÓN VISUAL ---
const COLORES = {
    AMARILLO_TUTORIAL: 0xfcd34d,
    ROJO_PELIGRO: 0xdc2626,
    VERDE_EXITO: 0x10b981,
    PURPURA_MISTICO: 0x9B59B6
};

const PATHS = {
    SABIO_BANNER: 'e:/PassQuirk/PassQuirkRPG/Documentación - Juego/Assets - PassQuirkRPG/Npcs/Tutorial_Sabio-1920x1080.png',
    ICONO_V1: 'e:/PassQuirk/PassQuirkRPG/Documentación - Juego/Assets - PassQuirkRPG/Iconos - Marca - PassQuirk/Icono - PassQuirk V1.png',
    PASSCOIN: '<:PassCoin:1441951548719759511>'
};

async function mostrarSpaceCentralUnificado(interaction, client) {
    const userId = interaction.user.id;
    const player = await client.gameManager.getPlayer(userId);
    const nombreUsuario = player ? player.name : interaction.user.username;

    if (!player) {
        await interaction.reply({ content: '❌ No tienes un personaje creado. Usa `/passquirkrpg` para comenzar.', ephemeral: true });
        return;
    }

    // Actualizar ubicación
    if (!player.exploration) player.exploration = {};
    player.exploration.currentZone = 'Space Central';
    
    // Mark as visited
    if (!player.exploration.visitedSpaceCentral) {
        player.exploration.visitedSpaceCentral = true;
    }
    await client.gameManager.playerDB.savePlayer(player);

    // --- LÓGICA DE MISIONES (ELSABIO) ---
    let sabioText = "";
    let sabioTitle = "ElSabio: Space Central";
    
    // Misión 1: Bosque Inicial (Conseguir dinero)
    if (!player.mission || player.mission.id === 'mision_tutorial_bosque') {
        if (!player.mission) {
            player.mission = { 
                id: 'mision_tutorial_bosque', 
                status: 'active', 
                desc: 'Consigue 50 PassCoins en el Bosque Inicial para pagar el Hotel.' 
            };
            await client.gameManager.playerDB.savePlayer(player);
        }

        if (player.mission.status === 'active') {
            sabioTitle = "ElSabio: Primera Misión";
            sabioText = `**ElSabio:** ¡Bienvenido a **Space Central**, **${nombreUsuario}**!\n\n` +
                `Antes de que te acomodes, hay un problema: **No tienes dinero**.\n` +
                `Necesitas **50 PassCoins** para alquilar una habitación en el Hotel y asegurar tus pertenencias.\n\n` +
                `🌲 **Tu Tarea:** Ve a **Explorar** -> **Bosque Inicial** y consigue esas monedas.\n` +
                `*No vuelvas hasta que tengas suficiente.*`;
        }
    } 
    // Misión 2: Viaje al Reino
    else if (player.mission.id === 'mision_viaje_reino') {
        if (player.mission.status === 'active') {
            sabioTitle = "ElSabio: El Llamado del Hogar";
            sabioText = `**ElSabio:** ¡Bien hecho con esas monedas! Ahora tienes un lugar seguro.\n\n` +
                `Es hora de que visites tu verdadero origen.\n` +
                `Ve al **Portal de los Reinos** (o usa Explorar) y viaja a tu **Reino Racial**.\n` +
                `*Allí encontrarás a tus iguales y aprenderás más sobre tu raza.*`;
        } else {
            sabioText = `**ElSabio:** Has cumplido con tus primeros deberes. Ahora el mundo es tuyo para explorar.`;
        }
    } 
    // Misión 3: Libertad / Default
    else {
        sabioText = `**ElSabio:** Space Central es el nexo de todo. Explora, comercia y prepárate para tus próximas aventuras.`;
    }

    // --- EMBED 1: ELSABIO (NARRATIVA) ---
    const embedSabio = new EmbedBuilder()
        .setTitle(`🧙‍♂️ **${sabioTitle}**`)
        .setDescription(sabioText)
        .setColor(COLORES.AMARILLO_TUTORIAL)
        .setImage('attachment://Tutorial_Sabio-1920x1080.png')
        .setFooter({ text: 'ElSabio • Guía del Aventurero' });

    // --- EMBED 2: SPACE CENTRAL HUB (GAMEPLAY) ---
    const embedHub = new EmbedBuilder()
        .setTitle(`⭐ **Space Central: El Nexo**`)
        .setDescription(
            `El corazón del multiverso PassQuirk. Aquí convergen todos los caminos.\n\n` +
            `🏨 **Hotel:** Descanso y Guardado (Desbloqueo: 50 PC)\n` +
            `⚔️ **Armería:** Compra y mejora de equipo\n` +
            `🌀 **Portal:** Viaje a Reinos Raciales\n` +
            `🗺️ **Explorar:** Zonas salvajes (Bosques, Mazmorras)`
        )
        .setColor(COLORES.PURPURA_MISTICO)
        .setImage('attachment://SpaceCentral_Concept.png') // Usamos el icono como "Concept Image"
        .setFooter({ text: 'Space Central • Hub Principal' });

    // --- BOTONES (UNIFICADOS) ---
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('hub_explorar').setLabel('Explorar').setStyle(ButtonStyle.Success).setEmoji('🗺️'),
        new ButtonBuilder().setCustomId('hub_hotel').setLabel('Hotel').setStyle(ButtonStyle.Primary).setEmoji('🏨'),
        new ButtonBuilder().setCustomId('hub_armeria').setLabel('Armería').setStyle(ButtonStyle.Primary).setEmoji('⚔️')
    );
    
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('hub_portal').setLabel('Portal Reinos').setStyle(ButtonStyle.Primary).setEmoji('🌀'),
        new ButtonBuilder().setCustomId('hub_perfil').setLabel('Perfil').setStyle(ButtonStyle.Secondary).setEmoji('👤'),
        new ButtonBuilder().setCustomId('hub_ayuda').setLabel('Ayuda').setStyle(ButtonStyle.Secondary).setEmoji('❓')
    );

    // --- ADJUNTOS ---
    const files = [];
    if (fs.existsSync(PATHS.SABIO_BANNER)) {
        files.push({ attachment: PATHS.SABIO_BANNER, name: 'Tutorial_Sabio-1920x1080.png' });
    } else {
        embedSabio.setImage(null);
    }

    if (fs.existsSync(PATHS.ICONO_V1)) {
        files.push({ attachment: PATHS.ICONO_V1, name: 'SpaceCentral_Concept.png' });
    } else {
        embedHub.setImage(null);
    }

    // --- ENVIAR RESPUESTA ---
    // Manejar diferido/respuesta
    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [embedSabio, embedHub], components: [row1, row2], files: files });
    } else {
        // Si es un comando slash nuevo, reply normal (o defer si tarda)
        // Aquí asumimos que si no está deferido, hacemos reply.
        await interaction.reply({ embeds: [embedSabio, embedHub], components: [row1, row2], files: files });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spacecentral')
        .setDescription('Viaja a Space Central, el centro del universo PassQuirk.'),
    async execute(interaction, client) {
        // Handle button interactions delegated to this command
        if (interaction.isButton()) {
            const action = interaction.customId;
            
            // Navegación
            if (action === 'hub_explorar') return client.commands.get('explorar').execute(interaction, client);
            if (action === 'hub_perfil') return client.commands.get('perfil').execute(interaction, client);
            if (action === 'hub_ayuda') return client.commands.get('ayuda').execute(interaction, client);
            
            // Hotel
            if (action === 'hub_hotel') return this.mostrarHotel(interaction, client);
            if (action === 'hub_hotel_rent') return this.rentHotelRoom(interaction, client);
            
            // Armería
            if (action === 'hub_armeria') return interaction.reply({ content: '⚔️ La Armería está recibiendo suministros. ¡Vuelve pronto!', ephemeral: true });
            
            // Portal
            if (action === 'hub_portal') return client.commands.get('explorar').execute(interaction, client); // Portal redirige a explorar por ahora

            // Volver
            if (action === 'hub_back' || action === 'ir_space_central') return mostrarSpaceCentralUnificado(interaction, client);
        }

        // Comando Slash Normal
        // Defer para asegurar tiempo de respuesta
        if (!interaction.replied && !interaction.deferred) await interaction.deferReply();
        
        await mostrarSpaceCentralUnificado(interaction, client);
    },

    // Métodos auxiliares exportados para uso externo si es necesario
    mostrarSpaceCentralUnificado,

    async mostrarHotel(interaction, client) {
        const player = await client.gameManager.getPlayer(interaction.user.id);
        const emojiHotel = '🏨';
        const emojiCoin = PATHS.PASSCOIN;

        const embed = new EmbedBuilder()
            .setTitle(`${emojiHotel} **Gran Hotel Space Central**`)
            .setDescription(`Bienvenido al Gran Hotel. Aquí puedes descansar y recuperarte.\n\n` +
                `**Servicios Disponibles:**\n` +
                `> **Habitación Estándar:** Recupera 100% HP y MP.\n` +
                `> **Costo:** 50 ${emojiCoin} PassCoins\n\n` +
                `*Tu saldo actual:* ${player.inventory?.gold || 0} ${emojiCoin}`)
            .setColor('#F1C40F')
            .setFooter({ text: 'Gran Hotel • Descanso Garantizado' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('hub_hotel_rent')
                    .setLabel('Alquilar Habitación (50 PC)')
                    .setEmoji('🛏️')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled((player.inventory?.gold || 0) < 50),
                new ButtonBuilder()
                    .setCustomId('hub_back')
                    .setLabel('Volver al Centro')
                    .setEmoji('⬅️')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        // Update or Reply based on context
        if (interaction.replied || interaction.deferred) {
             // Si es un update de botón, usamos editReply o update
             // Al ser un sub-menú, update es más limpio visualmente si reemplaza el mensaje original
             // Pero como Space Central son 2 embeds, y esto es 1, mejor editReply
             await interaction.editReply({ embeds: [embed], components: [row], files: [] });
        } else {
             await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }
    },

    async rentHotelRoom(interaction, client) {
        const player = await client.gameManager.getPlayer(interaction.user.id);
        const currentGold = player.inventory?.gold || 0;
        const emojiCoin = PATHS.PASSCOIN;

        if (currentGold < 50) {
            await interaction.reply({ content: `❌ No tienes suficientes PassCoins (50 requeridos). Tienes ${currentGold} ${emojiCoin}`, ephemeral: true });
            return;
        }

        // Deducir costo
        if (!player.inventory) player.inventory = { gold: 0, items: {} };
        player.inventory.gold = currentGold - 50;

        // Curar jugador
        player.stats.hp = player.stats.maxHp || 100;
        player.stats.mp = player.stats.maxMp || 50;

        // Verificar Misión 1 (Tutorial)
        let missionMsg = '';
        let misionCompletada = false;
        if (player.mission && player.mission.id === 'mision_tutorial_bosque') {
            player.mission.status = 'completed';
            player.mission.completedAt = new Date().toISOString();
            
            // Asignar siguiente misión
            player.mission = {
                id: 'mision_viaje_reino',
                status: 'active',
                step: 'intro',
                description: 'Usa el Portal de Exploración para viajar a tu Reino Racial.'
            };
            missionMsg = '\n\n📜 **¡Misión Actualizada!**\nHas descansado en el hotel. Ahora estás listo para viajar a tu reino.';
            misionCompletada = true;
        }

        await client.gameManager.playerDB.savePlayer(player);

        const embed = new EmbedBuilder()
            .setTitle('🛏️ **Descanso Completado**')
            .setDescription(`Has descansado en una habitación cómoda.\n\n` +
                `**¡HP y MP restaurados al máximo!**\n` +
                `Saldo restante: ${player.inventory.gold} ${emojiCoin}${missionMsg}`)
            .setColor('#2ECC71');
            
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('hub_back').setLabel('Volver a Space Central').setStyle(ButtonStyle.Primary).setEmoji('🔙')
        );

        await interaction.update({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction, client) {
        // Legacy handler wrapper
        return this.execute(interaction, client);
    }
};
