const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { OfficialEmbedBuilder, COLORS, EMOJIS } = require('../utils/embedStyles');
// const Canvas = require('canvas'); // Omitido temporalmente si causa problemas

class LevelSystem {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.xpBase = 100;
        this.xpMultiplier = 1.5;
    }

    // Calcular XP necesaria para el siguiente nivel
    calculateXpForNextLevel(level) {
        const lvl = Math.max(1, level || 1); // Proteger contra 0/null
        return Math.floor(this.xpBase * Math.pow(lvl, this.xpMultiplier));
    }

    // Generar barra de progreso textual
    generateProgressBar(current, max, size = 10) {
        const validCurrent = current || 0; // Handle undefined/NaN
        const validMax = max || 100;
        const percentage = Math.min(Math.max(validCurrent / validMax, 0), 1); // Clamp 0-1
        const progress = Math.round(size * percentage);
        const emptyProgress = size - progress;

        // Estilo de bloques azules
        const filledBlock = '🟦';
        const emptyBlock = '⬛'; // Fondo negro para contraste

        const progressText = filledBlock.repeat(progress);
        const emptyProgressText = emptyBlock.repeat(emptyProgress);

        return `\`${progressText}${emptyProgressText}\` ${Math.floor(percentage * 100)}%`;
    }

    async ensureChannels(guild) {
        if (!guild) return null;
        
        const channels = {};
        
        // 1. Buscar o crear categoría principal "MUNDO PASSQUIRK" (Referencia)
        let worldCategory = guild.channels.cache.find(c => c.name === '🌍 MUNDO PASSQUIRK' && c.type === 4);
        if (!worldCategory) {
             try {
                 worldCategory = await guild.channels.create({
                     name: '🌍 MUNDO PASSQUIRK',
                     type: 4,
                     position: 0 // Intentar poner arriba
                 });
             } catch (e) { console.error('Error creando categoría Mundo PassQuirk:', e); }
        }

        // 2. Buscar o crear nueva categoría "🐉 PassQuirk" (Para notificaciones)
        // Debe ir DEBAJO de Mundo PassQuirk
        let notifCategory = guild.channels.cache.find(c => c.name === '🐉 PassQuirk' && c.type === 4);
        if (!notifCategory) {
            try {
                notifCategory = await guild.channels.create({
                    name: '🐉 PassQuirk',
                    type: 4,
                    // Posición relativa: debajo de Mundo PassQuirk si existe
                    position: worldCategory ? worldCategory.position + 1 : 1,
                    permissionOverwrites: [
                        { id: guild.id, allow: ['ViewChannel'], deny: ['SendMessages'] },
                        { id: guild.client.user.id, allow: ['SendMessages', 'ViewChannel'] }
                    ]
                });
            } catch (e) { console.error('Error creando categoría 🐉 PassQuirk:', e); }
        } else {
            // Asegurar posición correcta si ya existe (SIEMPRE forzar que esté justo debajo)
            if (worldCategory && notifCategory.position !== worldCategory.position + 1) {
                try { await notifCategory.setPosition(worldCategory.position + 1); } catch(e) {}
            }
        }

        // Canal Nivel -> En categoría 🐉 PassQuirk
        let levelChannel = guild.channels.cache.find(c => c.name === '🆙-nivel');
        if (!levelChannel) {
             try {
                 const channels = await guild.channels.fetch();
                 levelChannel = channels.find(c => c.name === '🆙-nivel');
             } catch (e) {}
        }

        if (!levelChannel) {
            try {
                levelChannel = await guild.channels.create({
                    name: '🆙-nivel',
                    type: 0,
                    parent: notifCategory ? notifCategory.id : null,
                    permissionOverwrites: [
                        { id: guild.id, allow: ['ViewChannel'], deny: ['SendMessages'] },
                        { id: guild.client.user.id, allow: ['SendMessages', 'ViewChannel'] }
                    ]
                });
            } catch (e) { console.error('Error creando canal nivel:', e); }
        } else if (notifCategory && levelChannel.parentId !== notifCategory.id) {
             // Mover a la nueva categoría si está fuera
             try { await levelChannel.setParent(notifCategory.id); } catch(e) {}
        }
        channels.level = levelChannel;

        // Canal Notificaciones -> En categoría 🐉 PassQuirk
        let notifChannel = guild.channels.cache.find(c => c.name === '🔔-notificaciones');
        if (!notifChannel) {
             try {
                 const channels = await guild.channels.fetch();
                 notifChannel = channels.find(c => c.name === '🔔-notificaciones');
             } catch (e) {}
        }

        if (!notifChannel) {
            try {
                notifChannel = await guild.channels.create({
                    name: '🔔-notificaciones',
                    type: 0,
                    parent: notifCategory ? notifCategory.id : null,
                    permissionOverwrites: [
                        { id: guild.id, allow: ['ViewChannel'], deny: ['SendMessages'] },
                        { id: guild.client.user.id, allow: ['SendMessages', 'ViewChannel'] }
                    ]
                });
            } catch (e) { console.error('Error creando canal notificaciones:', e); }
        } else if (notifCategory && notifChannel.parentId !== notifCategory.id) {
             // Mover a la nueva categoría si está fuera
             try { await notifChannel.setParent(notifCategory.id); } catch(e) {}
        }
        channels.notif = notifChannel;
        
        return channels;
    }

    // Verificar subida de nivel
    async checkLevelUp(player, interaction) {
        if (!player) return false;
        
        const oldLevel = player.level || 1; // Capture old level
        let leveledUp = false;
        let currentLevel = player.level || 1;
        let currentXp = player.xp || 0;
        let nextLevelXp = this.calculateXpForNextLevel(currentLevel);

        while (currentXp >= nextLevelXp) {
            currentXp -= nextLevelXp;
            currentLevel++;
            nextLevelXp = this.calculateXpForNextLevel(currentLevel);
            leveledUp = true;
        }

        if (leveledUp) {
            player.level = currentLevel;
            player.xp = currentXp;
            
            // Actualizar stats base por nivel
            player.stats = player.stats || {};
            player.stats.maxHp = (player.stats.maxHp || 100) + 10;
            player.stats.maxMp = (player.stats.maxMp || 50) + 5;
            player.stats.attack = (player.stats.attack || 10) + 2;
            player.stats.defense = (player.stats.defense || 5) + 1;
            player.stats.hp = player.stats.maxHp; 
            player.stats.mp = player.stats.maxMp;

            await this.gameManager.playerDB.savePlayer(player);
            
            if (interaction && interaction.guild) {
                await this.ensureChannels(interaction.guild); // Ensure channels exist
                await this.sendLevelUpNotification(player, interaction);
                
                // Check for unlocks via NotificationSystem
                if (this.gameManager.systems && this.gameManager.systems.notification) {
                    await this.gameManager.systems.notification.checkUnlocks(interaction, player, oldLevel, currentLevel);
                }
            }
        }

        return leveledUp;
    }

    // Enviar notificación de nivel
    async sendLevelUpNotification(player, interaction) {
        const guild = interaction.guild;
        if (!guild) return;

        const channels = await this.ensureChannels(guild);
        const levelChannel = channels?.level;
        
        if (!levelChannel) return;

        // Crear imagen o embed de Level Up
        const embed = new OfficialEmbedBuilder()
            .setOfficialStyle('success')
            .setOfficialTitle(`🎉 ¡SUBIDA DE NIVEL!`, '🆙')
            .setOfficialDescription(`¡Felicidades <@${player.userId}>! Has alcanzado un nuevo rango de poder.`)
            .setThumbnail(player.profileIcon || player.avatar_url || interaction.user.displayAvatarURL())
            .addFields(
                { name: 'Nivel Actual', value: `\`${player.level}\``, inline: true },
                { name: 'XP Siguiente', value: `\`${this.calculateXpForNextLevel(player.level)}\``, inline: true },
                { name: 'Estadísticas', value: `❤️ HP: +10\n⚡ MP: +5\n⚔️ ATK: +2\n🛡️ DEF: +1`, inline: false }
            );

        await levelChannel.send({ content: `<@${player.userId}>`, embeds: [embed.getEmbed()] });
    }
}

module.exports = LevelSystem;