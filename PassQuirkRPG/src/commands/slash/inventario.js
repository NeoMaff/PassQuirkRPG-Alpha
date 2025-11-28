const { SlashCommandBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

// Helper to ensure InventorySystem
function ensureInventorySystem(client) {
    try {
        if (!client?.gameManager) return null;
        if (!client.gameManager.systems) client.gameManager.systems = {};
        if (client.gameManager.systems.inventory) return client.gameManager.systems.inventory;
        
        const InventorySystem = require('../../systems/inventory-system.js');
        client.gameManager.systems.inventory = new InventorySystem(client.gameManager);
        return client.gameManager.systems.inventory;
    } catch (error) {
        console.error('Error ensuring InventorySystem:', error);
        return null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventario')
        .setDescription('Muestra tu inventario, equipamiento y objetos.'),
    
    async execute(interaction, client, isEphemeral = false) {
        const userId = interaction.user.id;
        // Default category is 'all'
        const category = 'all';
        
        const inventorySystem = ensureInventorySystem(client);
        if (!inventorySystem) {
            const payload = { content: '❌ El sistema de inventario no está disponible.', ephemeral: true };
            if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
            else await interaction.reply(payload);
            return;
        }

        // Delegar al sistema de inventario
        await inventorySystem.showInventory(interaction, userId, category, 1, isEphemeral);
    },

    async handleInteraction(interaction, client) {
        const inventorySystem = ensureInventorySystem(client);
        if (!inventorySystem) {
            await interaction.reply({ content: '❌ Sistema no disponible.', ephemeral: true });
            return;
        }

        // Delegar interacciones de botones/menús si el sistema lo soporta
        // El sistema de inventario debería manejar sus propios botones si están prefijados correctamente
        // Pero si no, podemos añadir lógica aquí.
        // Por ahora, asumimos que el sistema de inventario maneja la lógica o que los botones
        // llaman a funciones específicas.
        
        // Nota: InventorySystem.showInventory genera un embed.
        // Si el sistema tiene un manejador de interacciones, lo llamamos.
        if (inventorySystem.handleInteraction) {
            await inventorySystem.handleInteraction(interaction);
        } else {
            // Fallback o lógica específica si es necesario
            // Por ejemplo, paginación
            const id = interaction.customId;
            if (id.startsWith('inv_page_')) {
                // Handle pagination manually if system doesn't
                // format: inv_page_<category>_<page>
                const parts = id.split('_');
                const category = parts[2];
                const page = parseInt(parts[3]);
                await inventorySystem.showInventory(interaction, interaction.user.id, category, page);
            }
        }
    }
};
