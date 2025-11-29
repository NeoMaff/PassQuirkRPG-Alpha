/**
 * Sistema de Inventario para PassQuirk RPG
 * 
 * Este sistema maneja todas las mecánicas de inventario del juego:
 * - Visualización de inventario
 * - Uso de objetos
 * - Equipamiento de objetos
 * - Venta de objetos
 * - Categorización de objetos
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../utils/embedStyles');
const { OfficialEmbedBuilder } = require('../utils/embedStyles');
const { OfficialButtonBuilder } = require('../utils/embedStyles');
const { OfficialSelectMenuBuilder } = require('../utils/embedStyles');

class InventorySystem {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.itemData = gameManager.gameData.ITEMS;

        // Configuración del inventario
        this.maxItemsPerPage = 15; // Aumentado de 5 a 15 como solicitado
        this.defaultSlots = 50;   // Aumentado de 20 a 50 como solicitado

        // Categorías de objetos (Actualizadas)
        this.categories = {
            all: { name: 'Todos los items', emoji: '🎒' },
            consumible: { name: 'Consumibles', emoji: '🧪' },
            material: { name: 'Materiales', emoji: '🪵' },
            tool: { name: 'Herramientas', emoji: '🛠️' },
            weapon: { name: 'Armas', emoji: '⚔️' },
            armor: { name: 'Armaduras', emoji: '🛡️' },
            accessory: { name: 'Accesorios', emoji: '💍' },
            // Eliminada 'especial' como categoría genérica, usamos tipos reales
        };
    }

    /**
     * Muestra el inventario del jugador
     */
    async showInventory(interaction, userId, category = 'all', page = 0, isEphemeral = false) {
        const player = await this.gameManager.getPlayer(userId);
        if (!player) {
            const payload = {
                content: '⚠️ No tienes un personaje creado. Usa `/character create` para crear uno.',
                ephemeral: true
            };
            if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
            else await interaction.reply(payload);
            return;
        }

        // Cargar inventario desde Supabase (tabla player_items)
        // El método getInventory del playerDB debe estar implementado para leer de la tabla relacional
        const inventoryItems = await this.gameManager.playerDB.getInventory(userId);
        
        // DEBUG: Verificar items cargados
        console.log(`[InventorySystem] Loaded ${inventoryItems.length} items for user ${userId}`);

        // Cargar equipamiento (puede seguir en JSON o migrar a tabla si se desea, por ahora asumimos JSON en player.inventory.equipment)
        const equipment = player.inventory?.equipment || {};
        const gold = player.gold || 0; // Usar columna gold de players

        // Obtener los items del inventario según la categoría
        const items = await this.getItemsByCategory(inventoryItems, category);

        // Calcular páginas
        const totalPages = Math.ceil(items.length / this.maxItemsPerPage);
        const currentPage = Math.min(page, Math.max(0, totalPages - 1));
        const startIndex = currentPage * this.maxItemsPerPage;
        const endIndex = Math.min(startIndex + this.maxItemsPerPage, items.length);
        const displayedItems = items.slice(startIndex, endIndex);

        // Crear Embed
        const embed = new OfficialEmbedBuilder()
            .setOfficialStyle('inventory')
            .setOfficialTitle(`Inventario`, this.categories[category].emoji)
            .setOfficialDescription(`Aquí puedes ver y gestionar tus objetos.`);

        // Info de cabecera
        embed.addOfficialField('Categoría', `${this.categories[category].emoji} ${this.categories[category].name}`, true);
        embed.addOfficialField('PassCoins', `${gold.toLocaleString()} ${EMOJIS.GOLD || '💰'}`, true);
        embed.addOfficialField('Espacio', `${inventoryItems.length}/${this.getInventoryCapacity(player)} objetos`, true);

        // Añadir items a mostrar
        if (displayedItems.length > 0) {
            // Lista vertical limpia (sin campos individuales para ahorrar espacio y ser más legible)
            let inventoryList = '';
            
            for (const { itemId, item, quantity } of displayedItems) {
                const equipStatus = this.isItemEquipped(player.inventory.equipment || {}, itemId) ? ' (Equipado)' : '';
                const rarityEmoji = item.rarityEmoji || ''; 
                
                // Formato lineal: [Emoji] *Nombre* `xN`
                inventoryList += `${rarityEmoji} \`${item.name}\` \`x${quantity}\`${equipStatus}\n`;
            }
            
            embed.setOfficialDescription(`Aquí puedes ver y gestionar tus objetos.\n\n${inventoryList}`);
            
        } else {
            embed.addOfficialField(
                '📦 Inventario Vacío',
                category === 'all'
                    ? 'No tienes ningún objeto en tu inventario. ¡Explora para encontrar tesoros o visita la tienda!'
                    : `No tienes objetos de tipo "${this.categories[category].name}". Prueba con otra categoría.`,
                false
            );
        }

        // Crear componentes de interacción
        const components = [];

        // Menú de categorías (filtrar la categoría actual)
        // Modificación: Mostrar siempre todas las categorías, no filtrar la actual.
        // Esto permite que si seleccionas "Consumibles" y quieres volver a "Todos", puedas hacerlo.
        const categoryMenu = new OfficialSelectMenuBuilder('inventory_category')
            .addInventoryCategories(); // No pasamos categoría para excluir, queremos todas
        components.push(new ActionRowBuilder().addComponents(categoryMenu.menu));

        // Botones de acción para el inventario
        if (displayedItems.length > 0) {
            // ... código de botones
        } else if (category !== 'all') {
            // Si no hay items en la categoría pero no es 'all', mostrar botón para volver a 'all'
            const resetFilter = new OfficialButtonBuilder()
                .addOfficialButton('inventory_category_all', 'Ver Todos', 'secondary', '🎒')
                .buildRows();
            components.push(...resetFilter);
        }

        // Botones de navegación si hay múltiples páginas
        if (totalPages > 1) {
            const navigationButtons = new OfficialButtonBuilder()
                .addNavigationButtons(currentPage, totalPages, 'inventory_page')
                .buildRows(3);
            components.push(...navigationButtons);
        }

        // Botón para volver al perfil (solo si no es ephemeral, porque si es ephemeral no tiene sentido volver al perfil general que es público)
        if (!isEphemeral) {
            const profileButton = new OfficialButtonBuilder()
                .addOfficialButton('character_profile', 'Volver al Perfil', 'secondary', '👤')
                .buildRows();
            components.push(...profileButton);
        }

        // Responder a la interacción
        const replyOptions = { embeds: [embed.getEmbed()], components, ephemeral: isEphemeral }; // getEmbed() necesario para OfficialEmbedBuilder

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(replyOptions);
        } else {
            await interaction.reply(replyOptions);
        }

        return { embed, components };
    }

    /**
     * Obtiene los items del inventario según la categoría
     * @param {Object[]} inventoryItems - Array de {item_key, quantity} desde DB
     */
    async getItemsByCategory(inventoryItems, category) {
        const result = [];

        // Cargar datos de items desde DB o caché del GM
        // Asumimos que GM tiene un caché de items o los cargamos bajo demanda
        // Para eficiencia, GM debería tener `gameData.ITEMS` poblado desde `public.items` al inicio
        
        // Importar RARITIES si no está disponible en el scope
        const RARITIES = require('../data/rarities');

        for (const entry of inventoryItems) {
            const itemId = entry.item_key;
            const quantity = entry.quantity;

            // Asegurar que this.gameManager.gameData.ITEMS está inicializado
            if (!this.gameManager.gameData.ITEMS) {
                this.gameManager.gameData.ITEMS = {};
            }

            let item = this.gameManager.gameData.ITEMS[itemId];
            
            // Fallback crítico: si no está en gameData, construirlo con la info mínima disponible
            if (!item) {
                // Intentar obtener datos del join de DB (entry.item)
                const dbItem = entry.item || {};
                
                // Si ni siquiera hay datos de DB, usar el ID como nombre (evita crash)
                const name = dbItem.name || itemId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                // Resolver rareza de forma segura
                let rarityVal = dbItem.rarity_id || 'mundano';
                if (typeof rarityVal !== 'string') {
                    // Si es objeto (por join), intentar sacar name o key
                    rarityVal = rarityVal.name || rarityVal.key || 'mundano';
                }
                const rarityKey = String(rarityVal).toLowerCase();
                
                const rarityData = RARITIES[rarityKey] || RARITIES['mundano'];

                item = {
                    id: itemId,
                    name: name,
                    type: this.mapDbCategory(dbItem.category) || 'material',
                    rarity: rarityData.name, 
                    emoji: '📦', // Emoji genérico
                    description: 'Objeto misterioso.',
                    rarityEmoji: rarityData.emoji
                };
                
                // Guardar en caché temporal para esta ejecución para evitar reconstruir
                this.gameManager.gameData.ITEMS[itemId] = item;
            } else if (!item.rarityEmoji) {
                // Si el item existe pero no tiene emoji de rareza (datos antiguos/cacheados)
                const rarityKey = (item.rarity || item.rarityId || 'mundano').toLowerCase();
                const rarityData = RARITIES[rarityKey] || RARITIES['mundano'];
                item.rarityEmoji = rarityData.emoji;
                // Asegurar nombre de rareza correcto también
                if (!item.rarity) item.rarity = rarityData.name;
            }

            if (category === 'all' || item.type === category) {
                result.push({ itemId, item, quantity });
            }
        }

        // Ordenar por rareza y nombre
        return result.sort((a, b) => {
            // Primero por tipo
            if (a.item.type !== b.item.type) {
                return a.item.type.localeCompare(b.item.type);
            }
            // Luego por nombre
            return a.item.name.localeCompare(b.item.name);
        });
    }

    mapDbCategory(cat) {
        if (!cat) return 'material'; // Default a material si no hay categoría
        const key = String(cat).toLowerCase();
        
        const map = {
            consumible: 'consumible',
            material: 'material',
            tool: 'tool',
            fish: 'consumible', // Peces son consumibles o materiales
            weapon: 'weapon',
            armor: 'armor',
            accessory: 'accessory',
            special: 'material' // Mapear especial a material para evitar categoría fantasma
        };
        return map[key] || 'material';
    }

    /**
     * Añade información de equipamiento al embed
     */
    addEquipmentInfo(embed, equipment) {
        const equipmentInfo = [];

        // Verificar cada slot de equipamiento
        const slots = {
            weapon: { name: 'Arma', emoji: '⚔️' },
            armor: { name: 'Armadura', emoji: '🛡️' },
            accessory: { name: 'Accesorio', emoji: '💍' }
        };

        for (const [slot, info] of Object.entries(slots)) {
            const itemId = equipment[slot];
            if (itemId && this.gameManager.gameData.ITEMS[itemId]) {
                const item = this.gameManager.gameData.ITEMS[itemId];
                equipmentInfo.push(`${info.emoji} **${info.name}:** ${item.name} (${item.effect})`);
            } else {
                equipmentInfo.push(`${info.emoji} **${info.name}:** No equipado`);
            }
        }

        embed.addOfficialField('Equipamiento', equipmentInfo.join('\n'), false, '🧰');
    }

    /**
     * Verifica si un item está equipado
     */
    isItemEquipped(equipment, itemId) {
        return Object.values(equipment).includes(itemId);
    }

    /**
     * Obtiene la capacidad del inventario del jugador
     */
    getInventoryCapacity(player) {
        // Capacidad base + bonificaciones
        let capacity = this.defaultSlots;
        // Lógica simple por ahora
        return capacity;
    }

    /**
     * Usa un objeto del inventario
     */
    async useItem(interaction, userId, itemId) {
        const player = await this.gameManager.getPlayer(userId);
        if (!player || !player.inventory || !player.inventory.items[itemId]) {
            await interaction.reply({
                content: '⚠️ No tienes ese objeto en tu inventario.',
                ephemeral: true
            });
            return false;
        }

        const item = this.gameManager.gameData.ITEMS[itemId];
        if (!item) {
            await interaction.reply({
                content: '⚠️ Objeto no encontrado en la base de datos del juego.',
                ephemeral: true
            });
            return false;
        }

        // Verificar si el objeto es usable
        if (item.type !== 'consumible' && item.type !== 'especial') {
            await interaction.reply({
                content: `⚠️ No puedes usar este tipo de objeto. Los objetos de tipo ${item.type} deben ser equipados, no usados.`,
                ephemeral: true
            });
            return false;
        }

        // Aplicar efectos del objeto
        const result = await this.applyItemEffects(player, item);

        // Consumir el objeto
        await this.gameManager.playerDB.useItem(userId, itemId, 1);

        // Mostrar resultado
        await interaction.reply({
            content: `✅ Has usado **${item.name}**. ${result.message}`,
            ephemeral: true
        });

        return true;
    }

    /**
     * Equipa un objeto
     */
    async equipItem(interaction, userId, itemId) {
        const player = await this.gameManager.getPlayer(userId);
        if (!player || !player.inventory || !player.inventory.items[itemId]) {
            await interaction.reply({
                content: '⚠️ No tienes ese objeto en tu inventario.',
                ephemeral: true
            });
            return false;
        }

        const item = this.gameManager.gameData.ITEMS[itemId];
        if (!item) {
            await interaction.reply({
                content: '⚠️ Objeto no encontrado en la base de datos del juego.',
                ephemeral: true
            });
            return false;
        }

        // Determinar el slot según el tipo de item
        let slot;
        switch (item.type) {
            case 'arma':
                slot = 'weapon';
                break;
            case 'armadura':
                slot = 'armor';
                break;
            case 'accesorio':
                slot = 'accessory';
                break;
            default:
                await interaction.reply({
                    content: `⚠️ No puedes equipar este tipo de objeto. Los objetos de tipo ${item.type} deben ser usados, no equipados.`,
                    ephemeral: true
                });
                return false;
        }

        // Equipar el objeto
        await this.gameManager.playerDB.equipItem(userId, itemId, slot);

        // Mostrar resultado
        await interaction.reply({
            content: `✅ Has equipado **${item.name}** en el slot de ${this.getSlotName(slot)}.`,
            ephemeral: true
        });

        return true;
    }

    /**
     * Vende un objeto
     */
    async sellItem(interaction, userId, itemId, quantity = 1) {
        const player = await this.gameManager.getPlayer(userId);
        if (!player || !player.inventory || !player.inventory.items[itemId]) {
            await interaction.reply({
                content: '⚠️ No tienes ese objeto en tu inventario.',
                ephemeral: true
            });
            return false;
        }

        const item = this.gameManager.gameData.ITEMS[itemId];
        if (!item) {
            await interaction.reply({
                content: '⚠️ Objeto no encontrado en la base de datos del juego.',
                ephemeral: true
            });
            return false;
        }

        // Verificar si tiene suficientes unidades
        if (player.inventory.items[itemId] < quantity) {
            await interaction.reply({
                content: `⚠️ No tienes suficientes unidades de este objeto. Tienes ${player.inventory.items[itemId]} y quieres vender ${quantity}.`,
                ephemeral: true
            });
            return false;
        }

        // Verificar si el objeto está equipado
        if (this.isItemEquipped(player.inventory.equipment, itemId)) {
            await interaction.reply({
                content: '⚠️ No puedes vender un objeto que está equipado. Desequípalo primero.',
                ephemeral: true
            });
            return false;
        }

        // Calcular precio de venta (50% del valor original)
        const sellPrice = Math.floor((item.price || 0) * 0.5) * quantity;

        // Consumir el objeto
        await this.gameManager.playerDB.useItem(userId, itemId, quantity);

        // Añadir oro
        player.inventory.gold = (player.inventory.gold || 0) + sellPrice;
        await this.gameManager.playerDB.savePlayer(player);

        // Mostrar resultado
        await interaction.reply({
            content: `💰 Has vendido ${quantity}x **${item.name}** por ${sellPrice} de oro.`,
            ephemeral: true
        });

        return true;
    }

    /**
     * Aplica los efectos de un objeto al jugador
     */
    async applyItemEffects(player, item) {
        // Parsear el efecto del objeto
        const effectText = item.effect || '';
        const result = { success: true, message: '' };

        // Efectos comunes
        if (effectText.includes('+') || effectText.includes('-')) {
            // Buscar patrones como "+10 HP", "-5 MP", etc.
            const statEffects = effectText.match(/([+-]\d+)\s+(\w+)/g) || [];

            for (const statEffect of statEffects) {
                const [_, amount, stat] = statEffect.match(/([+-]\d+)\s+(\w+)/) || [];
                if (!amount || !stat) continue;

                const numAmount = parseInt(amount);

                switch (stat.toUpperCase()) {
                    case 'HP':
                        player.stats.hp = Math.min(player.stats.hp + numAmount, player.stats.maxHp || 100);
                        result.message += `Recuperaste ${numAmount} HP. `;
                        break;
                    case 'MP':
                        player.stats.mp = Math.min(player.stats.mp + numAmount, player.stats.maxMp || 50);
                        result.message += `Recuperaste ${numAmount} MP. `;
                        break;
                    case 'EXP':
                        await this.gameManager.playerDB.addExperience(player.userId, numAmount);
                        result.message += `Ganaste ${numAmount} EXP. `;
                        break;
                }
            }
        }

        // Efectos especiales
        if (item.id === 'pergamino_teletransporte') {
            result.message = 'Puedes teletransportarte a cualquier zona desbloqueada.';
            // La lógica de teletransporte se implementaría en el comando específico
        }

        // Guardar cambios en el jugador
        await this.gameManager.playerDB.savePlayer(player);

        return result;
    }

    /**
     * Añade un objeto al inventario del jugador
     */
    async addItem(userId, itemId, quantity = 1) {
        return await this.gameManager.playerDB.addItem(userId, itemId, quantity);
    }

    /**
     * Obtiene el emoji para un tipo de objeto
     */
    getItemTypeEmoji(type) {
        const typeEmojis = {
            consumible: '🧪',
            material: '🪵',
            tool: '🛠️',
            weapon: '⚔️',
            armor: '🛡️',
            accessory: '💍'
        };

        return typeEmojis[type] || '📦';
    }

    /**
     * Obtiene el nombre de un slot de equipamiento
     */
    getSlotName(slot) {
        const slotNames = {
            weapon: 'Arma',
            armor: 'Armadura',
            accessory: 'Accesorio'
        };

        return slotNames[slot] || slot;
    }

    /**
     * Capitaliza la primera letra de un string
     */
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

module.exports = InventorySystem;
