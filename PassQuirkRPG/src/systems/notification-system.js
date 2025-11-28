const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { COLORS, EMOJIS } = require('../utils/embedStyles');
const ABILITIES = require('../data/abilities');

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

        // 1. Verificar Habilidades de Clase (Nivel 5)
        if (oldLevel < 5 && newLevel >= 5) {
            let playerClassKey = '';
            if (typeof player.class === 'object' && player.class !== null) {
                playerClassKey = player.class.id;
            } else if (typeof player.class === 'string') {
                playerClassKey = player.class.toLowerCase().replace(' ', '_');
            }
            
            const ability = ABILITIES[playerClassKey]?.power;
            
            if (ability) {
                unlocks.push({
                    type: 'skill',
                    title: '✨ Nueva Habilidad Desbloqueada',
                    name: ability.name,
                    emoji: ability.emoji,
                    description: `Has aprendido **${ability.name}**.\n${ability.description}`,
                    footer: '¡Úsala en combate!'
                });
            }
        }

        // 2. Verificar Herramientas (Nivel 10)
        if (oldLevel < 10 && newLevel >= 10) {
            unlocks.push({
                type: 'feature',
                title: '⚒️ Herramientas Desbloqueadas',
                name: 'Minería y Pesca',
                emoji: '⛏️',
                description: 'Ahora puedes usar **Picos** y **Cañas**.\n¡Ve a la Tienda en Space Central para comprarlos!',
                footer: 'Exploración Avanzada'
            });
        }

        // Si hay desbloqueos, notificar
        if (unlocks.length > 0) {
            await this.sendNotifications(interaction, player, unlocks);
        }
    }

    /**
     * Envía las notificaciones (Intenta crear canal privado o usa DM/Ephemeral)
     */
    async sendNotifications(interaction, player, unlocks) {
        const guild = interaction.guild;
        if (!guild) return; // No funciona en DM directo al bot sin servidor

        // Nombre del canal: notificaciones-usuario
        const channelName = `notificaciones-${player.username}`.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Buscar si ya existe (o crear)
        // NOTA: Crear canales por usuario es peligroso en servidores grandes (límite 500).
        // Se recomienda usar hilos privados o mensajes efímeros.
        // Siguiendo instrucciones: "automáticamente el bot cree un canal"
        
        let channel = guild.channels.cache.find(c => c.name === channelName);

        if (!channel) {
            try {
                channel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel], // Oculto para todos
                        },
                        {
                            id: player.userId,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], // Visible para el usuario
                        },
                        {
                            id: this.client.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                        }
                    ],
                    topic: `Buzón de notificaciones para ${player.username}`
                });

                // 🔔 Mensaje de bienvenida con mención explícita al crear el canal
                await channel.send(`¡Bienvenido a tu canal de notificaciones, <@${player.userId}>! Aquí recibirás actualizaciones importantes sobre tu progreso.`);

            } catch (error) {
                console.error('Error creando canal de notificaciones:', error);
                // Fallback: Enviar al canal actual como ephemeral
                await this.sendEphemeralNotifications(interaction, unlocks);
                return;
            }
        }

        // Enviar embeds al canal
        for (const unlock of unlocks) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.SUCCESS)
                .setTitle(unlock.title)
                .setDescription(`${unlock.emoji} **${unlock.name}**\n\n${unlock.description}`)
                .setFooter({ text: unlock.footer })
                .setTimestamp();

            await channel.send({ content: `<@${player.userId}>`, embeds: [embed] });
        }

        // Avisar al usuario donde mirar
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `🔔 ¡Tienes nuevas notificaciones en ${channel}!`, ephemeral: true });
        }
    }

    async sendEphemeralNotifications(interaction, unlocks) {
        const embeds = unlocks.map(unlock => 
            new EmbedBuilder()
                .setColor(COLORS.SUCCESS)
                .setTitle(unlock.title)
                .setDescription(`${unlock.emoji} **${unlock.name}**\n\n${unlock.description}`)
                .setFooter({ text: unlock.footer })
        );

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds, ephemeral: true });
        } else {
            await interaction.reply({ embeds, ephemeral: true });
        }
    }
}

module.exports = NotificationSystem;
