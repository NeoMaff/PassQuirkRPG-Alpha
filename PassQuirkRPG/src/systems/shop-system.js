// 🛒 SISTEMA DE TIENDA - Gestión de compras y ventas
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { COLORS, EMOJIS, OfficialEmbedBuilder } = require('../utils/embedStyles');
const RARITIES = require('../data/rarities');

/**
 * Catálogo de items disponibles en la tienda
 */
const SHOP_CATALOG = {
    weapons: {
        name: '⚔️ Armas',
        items: {
            'mundane_sword': {
                name: 'Espada Mundana',
                description: 'Una espada básica para novatos.',
                price: 50,
                currency: 'coins',
                stats: { attack: 5 },
                emoji: '🗡️',
                rarity: 'mundano',
                levelReq: 1
            },
            'refined_sword': {
                name: 'Espada Refinada',
                description: 'Forjada con acero de mejor calidad.',
                price: 500,
                currency: 'coins',
                stats: { attack: 12 },
                emoji: '⚔️',
                rarity: 'refinado',
                levelReq: 5
            },
            'refined_bow': {
                name: 'Arco Refinado',
                description: 'Tensado para mayor precisión.',
                price: 450,
                currency: 'coins',
                stats: { attack: 10, speed: 2 },
                emoji: '🏹',
                rarity: 'refinado',
                levelReq: 5
            }
        }
    },
    tools: {
        name: '⚒️ Herramientas',
        items: {
            'mundane_pickaxe': {
                name: 'Pico Mundano',
                description: 'Herramienta básica para minería superficial.',
                price: 100,
                currency: 'coins',
                type: 'tool',
                emoji: '⛏️',
                rarity: 'mundano',
                levelReq: 10
            },
            'mundane_rod': {
                name: 'Caña Mundana',
                description: 'Caña simple para pescar en aguas tranquilas.',
                price: 100,
                currency: 'coins',
                type: 'tool',
                emoji: '🎣',
                rarity: 'mundano',
                levelReq: 10
            }
        }
    },
    armor: {
        name: '🛡️ Armaduras',
        items: {
            'armor_basic': {
                name: 'Armadura Básica',
                description: 'Protección esencial para aventureros',
                price: 600,
                currency: 'coins',
                stats: { defense: 15 },
                emoji: '🛡️'
            },
            'helmet_basic': {
                name: 'Casco Básico',
                description: 'Protege tu cabeza en combate',
                price: 300,
                currency: 'coins',
                stats: { defense: 8 },
                emoji: '⛑️'
            }
        }
    },
    consumables: {
        name: '🧪 Consumibles',
        items: {
            'health_potion': {
                name: 'Poción de Salud',
                description: 'Restaura 50 HP instantáneamente',
                price: 100,
                currency: 'coins',
                effect: 'heal_50',
                emoji: '🧪'
            },
            'mana_potion': {
                name: 'Poción de Maná',
                description: 'Restaura 30 MP instantáneamente',
                price: 80,
                currency: 'coins',
                effect: 'mana_30',
                emoji: '💙'
            }
        }
    }
};

class ShopSystem {
    /**
     * Muestra el catálogo principal de la tienda
     */
    static async showMainCatalog() {
        const embedBuilder = new OfficialEmbedBuilder()
            .setOfficialStyle('shop')
            .setOfficialTitle('Tienda PassQuirk - Catálogo Principal', OFFICIAL_EMOJIS.SHOP)
            .setOfficialDescription(
                '**¡Bienvenido a la tienda oficial de PassQuirk!** 🛒\n\n' +
                'Aquí encontrarás todo lo necesario para tu aventura. ' +
                'Selecciona una categoría abajo para ver los items disponibles.\n\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            );

        // Agregar campos visuales de categorías
        Object.entries(SHOP_CATALOG).forEach(([key, category]) => {
            const itemCount = Object.keys(category.items).length;
            embedBuilder.addOfficialField(
                category.name,
                `${itemCount} items disponibles`,
                true,
                category.name.split(' ')[0]
            );
        });

        // Crear Menú de Selección de Categoría
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('shop_select_category')
            .setPlaceholder('Selecciona una categoría de la tienda')
            .addOptions(
                Object.entries(SHOP_CATALOG).map(([key, cat]) => ({
                    label: cat.name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').trim(), // Limpiar emojis del nombre para el label
                    description: `Ver items de ${cat.name}`,
                    value: key,
                    emoji: cat.name.split(' ')[0] // Asumimos que el emoji es el primer caracter/bloque
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        return { 
            embeds: [embedBuilder.getEmbed()], 
            components: [row] 
        };
    }

    /**
     * Muestra los items de una categoría específica
     */
    static async showCategory(categoryKey) {
        const category = SHOP_CATALOG[categoryKey];
        if (!category) throw new Error('Categoría no encontrada');

        const embedBuilder = new OfficialEmbedBuilder()
            .setOfficialStyle('shop')
            .setOfficialTitle(`${category.name} - Tienda PassQuirk`, OFFICIAL_EMOJIS.SHOP)
            .setOfficialDescription(
                `**Items disponibles en ${category.name}:**\n` +
                'Selecciona un item para comprarlo o usa el menú para cambiar de categoría.\n\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            );

        // Agregar items al embed
        Object.entries(category.items).forEach(([itemKey, item]) => {
            const currency = item.currency === 'coins' ? '🪙' : '💎';
            const statsText = item.stats ?
                Object.entries(item.stats).map(([stat, value]) => `${stat}: +${value}`).join(', ') :
                item.effect || 'Consumible';
            
            // Obtener emoji de rareza si existe
            const rarityEmoji = RARITIES[item.rarity]?.emoji || '';

            embedBuilder.addOfficialField(
                `${item.emoji} ${item.name} ${rarityEmoji}`,
                `${item.description}\n**Precio:** ${item.price} ${currency}\n**Efecto:** ${statsText}`,
                true
            );
        });

        // Botones de compra (limitado a 5 por fila, si hay muchos items mejor usar select menu para comprar)
        // Para simplicidad, usamos un Select Menu para COMPRAR items de esta categoría
        const buySelectMenu = new StringSelectMenuBuilder()
            .setCustomId(`shop_buy_select_${categoryKey}`)
            .setPlaceholder('Selecciona un item para comprar')
            .addOptions(
                Object.entries(category.items).map(([key, item]) => ({
                    label: `${item.name} (${item.price} ${item.currency === 'coins' ? 'PC' : 'Gemas'})`,
                    description: item.description.substring(0, 50),
                    value: key,
                    emoji: item.emoji
                }))
            );
        
        // Botón para volver
        const backButton = new ButtonBuilder()
            .setCustomId('shop_back_main')
            .setLabel('Volver al Catálogo')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️');

        const row1 = new ActionRowBuilder().addComponents(buySelectMenu);
        const row2 = new ActionRowBuilder().addComponents(backButton);

        return { 
            embeds: [embedBuilder.getEmbed()], 
            components: [row1, row2] 
        };
    }

    /**
     * Maneja interacciones de la tienda
     */
    static async handleInteraction(interaction) {
        const { customId } = interaction;

        try {
            if (customId === 'shop_select_category') {
                const selectedCategory = interaction.values[0];
                const { embeds, components } = await this.showCategory(selectedCategory);
                await interaction.update({ embeds, components });
            } 
            else if (customId.startsWith('shop_buy_select_')) {
                const categoryKey = customId.replace('shop_buy_select_', '');
                const itemKey = interaction.values[0];
                
                // Intentar compra
                const result = await this.purchaseItem(interaction.user.id, categoryKey, itemKey, 1);
                
                await interaction.reply({ 
                    content: `✅ **¡Compra exitosa!**\nHas comprado **${result.quantity}x ${result.itemName}** por **${result.totalPrice} ${result.currency}**.`,
                    ephemeral: true 
                });
            }
            else if (customId === 'shop_back_main') {
                const { embeds, components } = await this.showMainCatalog();
                await interaction.update({ embeds, components });
            }
        } catch (error) {
            console.error('Shop Interaction Error:', error);
            const replyMethod = interaction.deferred || interaction.replied ? 'followUp' : 'reply';
            await interaction[replyMethod]({ 
                content: `❌ Error en la tienda: ${error.message}`, 
                ephemeral: true 
            });
        }
    }

    /**
     * Procesa la compra de un item
     */
    static async purchaseItem(userId, categoryKey, itemKey, quantity = 1) {
        const playerDB = require('../data/player-database');
        
        const category = SHOP_CATALOG[categoryKey];
        if (!category) throw new Error('Categoría no encontrada');

        const item = category.items[itemKey];
        if (!item) throw new Error('Item no encontrado');

        // 1. Obtener jugador
        const player = await playerDB.getPlayer(userId);
        if (!player) throw new Error('Jugador no encontrado');

        const totalPrice = item.price * quantity;
        const currency = item.currency || 'coins';
        const levelReq = item.levelReq || 1;

        // 1.5 Verificar Nivel
        if ((player.level || 1) < levelReq) {
            throw new Error(`Necesitas ser Nivel ${levelReq} para comprar este objeto.`);
        }

        // 2. Verificar fondos y realizar cobro
        if (currency === 'coins') {
            // Usar wallet_transactions para PassCoins
            // Verificar saldo actual (DB o memoria)
            if ((player.gold || 0) < totalPrice) {
                throw new Error(`Fondos insuficientes. Necesitas ${totalPrice} PassCoins.`);
            }

            // Registrar transacción (el trigger actualizará el saldo en DB)
            await playerDB.addWalletTransaction(
                userId,
                totalPrice,
                'spend',
                'shop',
                { item_key: itemKey, quantity, category: categoryKey }
            );
            
            // Actualizar memoria para reflejar cambio inmediato
            player.gold -= totalPrice;
            
        } else {
            throw new Error('Moneda no soportada.');
        }

        // 3. Añadir item al inventario
        const added = await playerDB.addItem(userId, itemKey, quantity);
        
        if (!added) {
            // Revertir cobro si falla la entrega (simple compensación)
            if (currency === 'coins') {
                 await playerDB.addWalletTransaction(userId, totalPrice, 'earn', 'refund', { reason: 'delivery_failed' });
                 player.gold += totalPrice;
            }
            throw new Error('Error al entregar el item. Se ha reembolsado el dinero.');
        }

        return {
            success: true,
            itemName: item.name,
            quantity,
            totalPrice,
            currency: 'PassCoins'
        };
    }

    /**
     * Obtiene información de un item específico
     */
    static getItemInfo(categoryKey, itemKey) {
        const category = SHOP_CATALOG[categoryKey];
        if (!category) return null;

        return category.items[itemKey] || null;
    }

    /**
     * Busca items por nombre
     */
    static searchItems(query) {
        const results = [];

        Object.entries(SHOP_CATALOG).forEach(([categoryKey, category]) => {
            Object.entries(category.items).forEach(([itemKey, item]) => {
                if (item.name.toLowerCase().includes(query.toLowerCase()) ||
                    item.description.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        categoryKey,
                        itemKey,
                        item,
                        category: category.name
                    });
                }
            });
        });

        return results;
    }
}

module.exports = {
    ShopSystem,
    SHOP_CATALOG
};