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
        await inventorySystem.showInventory(interaction, userId, category, 0, isEphemeral); // Página 0 inicial
    },

    async handleInteraction(interaction, client) {
        const inventorySystem = ensureInventorySystem(client);
        if (!inventorySystem) return;

        const id = interaction.customId;

        // Manejo directo de botones del inventario
        if (id === 'inventory_category') {
            const selected = interaction.values[0];
            await inventorySystem.showInventory(interaction, interaction.user.id, selected, 0);
        } 
        else if (id === 'inventory_category_all') {
            await inventorySystem.showInventory(interaction, interaction.user.id, 'all', 0);
        }
        else if (id.startsWith('inventory_page_')) {
            const page = parseInt(id.split('_')[2]);
            // Necesitamos saber la categoría actual, pero el botón stateless no la tiene
            // Asumimos 'all' o intentamos recuperarla del embed si fuera posible (complejo)
            // Por simplicidad, reiniciamos a 'all' o guardamos estado en DB temporal
            // TODO: Mejorar persistencia de estado de UI
            await inventorySystem.showInventory(interaction, interaction.user.id, 'all', page);
        }
    }
};
