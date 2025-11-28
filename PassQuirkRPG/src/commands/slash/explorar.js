const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../../utils/embedStyles');
const { ENEMIES_BY_ZONE } = require('../../data/passquirk-official-data');

// --- DATOS DE UI ---
const CONTINENTS = [
    { name: 'Alacrya', emoji: '🌍', description: 'El continente principal. Hogar de los 4 Reinos.' }
];

// Helper to ensure ExplorationSystem
function ensureExplorationSystem(client) {
    try {
        if (!client?.gameManager) return null;
        if (!client.gameManager.systems) client.gameManager.systems = {};
        if (client.gameManager.systems.exploration) return client.gameManager.systems.exploration;
        
        const ExplorationSystem = require('../../systems/exploration-system.js');
        client.gameManager.systems.exploration = new ExplorationSystem(client.gameManager);
        return client.gameManager.systems.exploration;
    } catch (error) {
        console.error('Error ensuring ExplorationSystem:', error);
        return null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('explorar')
        .setDescription('Explora el mundo de PassQuirk RPG.'),

    async execute(interaction, client) {
        const userId = interaction.user.id;
        const explorationSystem = ensureExplorationSystem(client);
        
        if (!explorationSystem) {
            await interaction.reply({ content: '❌ El sistema de exploración no está disponible.', ephemeral: true });
            return;
        }

        if (explorationSystem.activeExplorations.has(userId)) {
            // Restaurar sesión activa
            const exploration = explorationSystem.activeExplorations.get(userId);
            await explorationSystem.updateExplorationEmbed(interaction, exploration, 'Has vuelto a tu exploración activa.');
            return; // Asegurar que no continue y cause errores
        }

        // Mostrar selección de continente
        await this.showContinentSelection(interaction);
    },

    async handleInteraction(interaction, client) {
        const id = interaction.customId;
        const userId = interaction.user.id;
        const explorationSystem = ensureExplorationSystem(client);

        // --- DELEGACIÓN AL SISTEMA DE EXPLORACIÓN ---
        // Si el ID pertenece al sistema de exploración (prefijos definidos en exploration-system.js)
        if (id.startsWith('explore_mode_') || 
            id.startsWith('explore_cancel_') || 
            id.startsWith('explore_continue_') || 
            id.startsWith('explore_flee_') || 
            id.startsWith('explore_battle_') || 
            id.startsWith('explore_history_') || 
            id.startsWith('explore_bag_') || 
            id.startsWith('explore_info_')) {
            
            await explorationSystem.handleInteraction(interaction);
            return;
        }

        // --- NAVEGACIÓN DE MENÚS (LOCAL) ---
        if (id === 'explore_continent_select') {
            await interaction.deferUpdate(); // Defer to prevent interaction fail
            const continent = interaction.values[0];
            // Aquí podríamos filtrar zonas por continente, por ahora asumimos Alacrya
            await this.showZoneSelection(interaction, client, continent);
        }
        else if (id === 'explore_zone_select') {
            const zoneName = interaction.values[0];
            const player = await client.gameManager.getPlayer(userId);
            
            try {
                // Iniciar exploración en el sistema
                // Diferir la respuesta para evitar timeouts o "Unknown interaction" si tarda
                await interaction.deferUpdate();
                await explorationSystem.startExploration(interaction, player, zoneName);
            } catch (error) {
                if (interaction.deferred) await interaction.followUp({ content: `❌ Error al iniciar exploración: ${error.message}`, ephemeral: true });
                else await interaction.reply({ content: `❌ Error al iniciar exploración: ${error.message}`, ephemeral: true });
            }
        }
        else if (id === 'explore_back_continent') {
            await interaction.deferUpdate(); // Defer to prevent interaction fail
            await this.showContinentSelection(interaction);
        }
        else if (id === 'explore_back_hub') {
            // Volver a Space Central (Intentar ejecutar comando)
            await interaction.deferUpdate(); // Defer before calling other command if it edits reply
            const cmd = client.commands.get('spacecentral') || client.commands.get('passquirkrpg');
            if (cmd) await cmd.execute(interaction, client);
            else await interaction.editReply({ content: '❌ Hub no disponible.', embeds: [], components: [] });
        }
    },

    async showContinentSelection(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🌍 Selección de Continente')
            .setDescription('El mundo de PassQuirk es vasto. Selecciona un continente para comenzar tu exploración.')
            .setColor(COLORS.EXPLORATION);

        const menu = new StringSelectMenuBuilder()
            .setCustomId('explore_continent_select')
            .setPlaceholder('Selecciona un continente...')
            .addOptions(CONTINENTS.map(c => ({
                label: c.name,
                value: c.name,
                description: c.description,
                emoji: c.emoji
            })));

        const row = new ActionRowBuilder().addComponents(menu);
        const rowBack = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('explore_back_hub').setLabel('Volver a Space Central').setStyle(ButtonStyle.Secondary).setEmoji('🏠')
        );

        const payload = { embeds: [embed], components: [row, rowBack], ephemeral: true };
        
        if (interaction.replied || interaction.deferred) await interaction.editReply(payload);
        else await interaction.reply(payload);
    },

    async showZoneSelection(interaction, client, continent) {
        const userId = interaction.user.id;
        const player = await client.gameManager.getPlayer(userId);

        // Filtrar zonas disponibles desde explorationSystem (o data oficial)
        // Usaremos las zonas definidas en explorationSystem para asegurar consistencia
        const explorationSystem = ensureExplorationSystem(client);
        const availableZones = Object.values(explorationSystem.zones);

        // Filtrar zonas relevantes para el jugador (Nivel)
        const relevantZones = availableZones.filter(z => z.minLevel <= (player.level || 1) + 5);

        // Crear opciones de menú
        const options = relevantZones.map(z => ({
            label: z.name,
            value: z.name, // Usamos el nombre como ID por simplicidad en este refactor
            description: `Nvl ${z.minLevel}-${z.maxLevel} • ${z.difficulty}`,
            emoji: '📍'
        }));

        if (options.length === 0) {
            await interaction.reply({ content: '⚠️ No hay zonas disponibles.', ephemeral: true });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`🗺️ Zonas de ${continent}`)
            .setDescription(`Selecciona una zona para explorar. Tu nivel actual: **${player.level}**`)
            .setColor(COLORS.EXPLORATION);

        const menu = new StringSelectMenuBuilder()
            .setCustomId('explore_zone_select')
            .setPlaceholder('Selecciona una zona...')
            .addOptions(options.slice(0, 25)); // Max 25 options

        const row = new ActionRowBuilder().addComponents(menu);
        const rowBack = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('explore_back_continent').setLabel('Volver a Continentes').setStyle(ButtonStyle.Secondary).setEmoji('🔙')
        );

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ embeds: [embed], components: [row, rowBack] });
        } else {
            await interaction.update({ embeds: [embed], components: [row, rowBack] });
        }
    }
};
