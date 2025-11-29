const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { COLORS, EMOJIS } = require('../utils/embedStyles');
const OFFICIAL_DATA = require('../data/passquirk-official-data');

/**
 * 🔔 Sistema de Notificaciones de PassQuirk
 * Gestiona avisos de nivel, desbloqueos y logros.
 */
class NotificationSystem {
    constructor(client) {
        this.client = client;
    }

    /**
     * Verifica y envía notificaciones de desbloqueo al subir de nivel
     */
    async checkUnlocks(interaction, player, oldLevel, newLevel) {
        const unlocks = [];
        const playerClass = typeof player.class === 'string' ? player.class : (player.class?.id || player.class?.name || '');
        
        // Normalizar clave para búsqueda insensible a acentos y mayúsculas
        const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const classKey = normalize(playerClass);
        
        // Buscar datos oficiales
        let classData = OFFICIAL_DATA.BASE_CLASSES[playerClass.toUpperCase()]; // Intento directo
        if (!classData) {
             // Búsqueda robusta
             const k = Object.keys(OFFICIAL_DATA.BASE_CLASSES).find(k => normalize(k) === classKey);
             if (k) classData = OFFICIAL_DATA.BASE_CLASSES[k];
        }

        // 1. Nivel 5: Habilidad Básica + Herramientas
        if (oldLevel < 5 && newLevel >= 5) {
            // Habilidad Básica
            if (classData && classData.abilities && classData.abilities.basic) {
                const ability = classData.abilities.basic;
                unlocks.push({
                    type: 'skill',
                    title: '✨ Nueva Habilidad Desbloqueada',
                    name: ability.name,
                    emoji: ability.emoji || '✨',
                    description: `Has aprendido **${ability.name}** (Básica).\n${ability.damage} de daño.`,
                    footer: '¡Úsala en combate!'
                });
            }

            // Herramientas (Minería/Pesca)
            unlocks.push({
                type: 'feature',
                title: '⚒️ Herramientas Desbloqueadas',
                name: 'Minería y Pesca',
                emoji: '⛏️',
                description: 'Ahora puedes usar **Picos** y **Cañas** en tus exploraciones.\n¡Ve a la Tienda en Space Central para comprarlos!',
                footer: 'Exploración Avanzada'
            });
        }

        // 2. Nivel 10: Habilidad de Poder
        if (oldLevel < 10 && newLevel >= 10) {
            if (classData && classData.abilities && classData.abilities.power) {
                const ability = classData.abilities.power;
                unlocks.push({
                    type: 'skill',
                    title: '🔥 Habilidad de Poder Desbloqueada',
                    name: ability.name,
                    emoji: ability.emoji || '🔥',
                    description: `Has aprendido **${ability.name}**.\nEfecto: ${ability.effect || 'Daño masivo'}`,
                    footer: '¡Poder desatado!'
                });
            }
        }

        // 3. Nivel 15: Habilidad Especial
        if (oldLevel < 15 && newLevel >= 15) {
            if (classData && classData.abilities && classData.abilities.special) {
                const ability = classData.abilities.special;
                unlocks.push({
                    type: 'skill',
                    title: '🌟 Habilidad Especial Desbloqueada',
                    name: ability.name,
                    emoji: ability.emoji || '🌟',
                    description: `Has desbloqueado tu técnica definitiva: **${ability.name}**.\n¡Úsala sabiamente!`,
                    footer: '¡Técnica Definitiva!'
                });
            }
        }

        // Si hay desbloqueos, notificar
        if (unlocks.length > 0) {
            await this.sendNotifications(interaction, player, unlocks);
        }
    }

    /**
     * Envía las notificaciones al canal global 🔔-notificaciones
     */
    async sendNotifications(interaction, player, unlocks) {
        const guild = interaction.guild;
        if (!guild) return; 

        // Buscar canal global '🔔-notificaciones'
        let channel = guild.channels.cache.find(c => c.name === '🔔-notificaciones');
        
        if (!channel) {
             // Si no existe, intentar buscar en la categoría 🐉 PassQuirk
             // O delegar al LevelSystem que sabe crearlo (pero aquí solo notificamos si existe)
             console.warn('Canal 🔔-notificaciones no encontrado. Usando fallback efímero.');
             await this.sendEphemeralNotifications(interaction, unlocks);
             return;
        }

        // Enviar embeds al canal global con mención
        for (const unlock of unlocks) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.SUCCESS)
                .setTitle(unlock.title)
                .setDescription(`${unlock.emoji} **${unlock.name}**\n\n${unlock.description}`)
                .setThumbnail(player.profileIcon || player.avatar_url || interaction.user.displayAvatarURL())
                .setFooter({ text: `${unlock.footer} • ${player.username}` })
                .setTimestamp();

            await channel.send({ content: `<@${player.userId}>`, embeds: [embed] });
        }

        // Avisar al usuario donde mirar (si es interacción directa)
        /*
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `🔔 ¡Tienes nuevas notificaciones en ${channel}!`, ephemeral: true });
        }
        */
    }

    async sendEphemeralNotifications(interaction, unlocks) {
        const embeds = unlocks.map(unlock => 
            new EmbedBuilder()
                .setColor(COLORS.SUCCESS)
                .setTitle(unlock.title)
                .setDescription(`${unlock.emoji} **${unlock.name}**\n\n${unlock.description}`)
                .setFooter({ text: unlock.footer })
        );

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds, ephemeral: true });
            } else {
                await interaction.reply({ embeds, ephemeral: true });
            }
        } catch (e) {
            console.error('Error enviando notificación efímera:', e);
        }
    }
}

module.exports = NotificationSystem;
