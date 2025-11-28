/**
 * Sistema de Exploración para PassQuirk RPG
 * 
 * Este sistema maneja todas las mecánicas de exploración del juego:
 * - Exploración de zonas (Auto/Manual)
 * - Eventos aleatorios (Combate, Minería, Pesca)
 * - Descubrimientos (Items)
 * - Progresión de zonas
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, EMOJIS } = require('../utils/embedStyles');
const { ENEMIES_BY_ZONE } = require('../data/passquirk-official-data');
const RARITIES = require('../data/rarities');
const PassSystem = require('./passystem');

class ExplorationSystem {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.activeExplorations = new Map();

        // Probabilidades de eventos (0-1)
        this.eventProbabilities = {
            nothing: 0.30,  // Nada (Solo en manual)
            enemy: 0.40,    // Combate
            item: 0.15,     // Objeto
            mining: 0.10,   // Minería
            fishing: 0.05   // Pesca
            // Quirk y Treasure deshabilitados por ahora
        };

        // Configuración de zonas (Hardcoded por ahora, idealmente DB/OfficialData)
        this.zones = {
            'Bosque Inicial': {
                name: 'Mayoi - Bosque Inicial',
                description: 'Un bosque denso y misterioso que rodea Space Central.',
                minLevel: 1,
                maxLevel: 10,
                difficulty: 'Normal',
                image: 'https://media.discordapp.net/attachments/1304192837335613470/1321946864983015484/Bosque_Inicial.png',
                enemyTypes: ['slime_bosque', 'lobo_sombrio'], // Explicito para Mayoi
                miningCap: 'Mundano',
                fishingCap: 'Mundano',
                distance: 0 // Zona inicial
            },
            // ... Otras zonas se pueden añadir aquí o cargar de OfficialData
        };
        
        // Mapear nombres de OfficialData a claves internas
        Object.keys(ENEMIES_BY_ZONE).forEach(key => {
            const zoneData = ENEMIES_BY_ZONE[key];
             if (key !== 'bosque_inicial') { // Bosque Inicial ya está arriba con imagen
                // Parsear nivel
                let minLevel = 1;
                let maxLevel = 999;
                
                if (zoneData.level_range) {
                    const parts = zoneData.level_range.split('-');
                    if (parts.length === 2) {
                        minLevel = parseInt(parts[0]) || 1;
                        maxLevel = parseInt(parts[1]) || 999;
                    } else if (zoneData.level_range.includes('+')) {
                        minLevel = parseInt(zoneData.level_range) || 1;
                        maxLevel = 999;
                    } else if (zoneData.level_range === 'Any') {
                         // Por defecto 1-999
                    }
                }

                this.zones[zoneData.name] = {
                    name: zoneData.name,
                    description: `Zona de nivel ${zoneData.level_range}`,
                    minLevel: minLevel, 
                    maxLevel: maxLevel,
                    difficulty: 'Variable',
                    enemyTypes: Object.keys(zoneData.enemies),
                    miningCap: 'Refinado',
                    fishingCap: 'Refinado',
                    distance: 1000
                };
             }
        });
    }

    /**
     * Inicia el proceso de exploración (Selección de Modo)
     */
    async startExploration(interaction, player, zoneName) {
        const userId = player.userId;

        // 1. Verificar memoria
        if (this.activeExplorations.has(userId)) {
            const existing = this.activeExplorations.get(userId);
            if (Date.now() - existing.lastInteraction > 1000 * 60 * 15) { 
                this.activeExplorations.delete(userId);
            } else {
                // Si ya está en memoria, simplemente mostramos el estado actual
                await this.updateExplorationEmbed(interaction, existing, 'Continuando exploración...');
                return;
            }
        }

        // 2. Verificar persistencia (DB)
        const activeSession = await this.gameManager.playerDB.getActiveExplorationSession(userId);
        
        if (activeSession) {
            // Restaurar sesión desde DB
            let zone = Object.values(this.zones).find(z => z.name === activeSession.zone_id || z.name.includes(activeSession.zone_id));
            // Si no encontramos la zona por nombre exacto, intentar mapeo inverso o usar default
            if (!zone) {
                // Fallback: buscar por ID similar o usar la primera
                zone = this.zones['Bosque Inicial']; 
            }

            const exploration = {
                id: activeSession.session_id, // Usar ID de la DB
                userId: userId,
                player: player,
                zone: zone,
                status: 'exploring',
                mode: activeSession.events_log.find(e => e.type === 'start')?.mode || 'manual',
                startTime: new Date(activeSession.start_time).getTime(),
                lastInteraction: Date.now(),
                stats: {
                    distance: 0, // Idealmente guardar en events_log o rewards_summary
                    enemiesDefeated: 0,
                    itemsFound: 0,
                    passcoinsFound: 0,
                    events: activeSession.events_log.map(e => `[Restaurado] ${e.type}`)
                },
                currentEvent: null,
                fleeAttempts: 3
            };
            
            this.activeExplorations.set(userId, exploration);
            await this.updateExplorationEmbed(interaction, exploration, '🔄 Sesión restaurada. ¡Continúa tu aventura!');
            return;
        }

        // 3. Nueva Exploración
        // Resolver zona (Manejo flexible de nombres)
        let zone = this.zones[zoneName];
        if (!zone) {
            const key = Object.keys(this.zones).find(k => k.toLowerCase().includes(zoneName.toLowerCase()) || zoneName.toLowerCase().includes(k.toLowerCase()));
            if (key) zone = this.zones[key];
        }

        if (!zone) throw new Error(`La zona "${zoneName}" no existe.`);

        // Crear sesión en DB
        const dbSession = await this.gameManager.playerDB.createExplorationSession(userId, zone.name, 'manual'); // Mode se define luego, por defecto manual

        // Crear objeto de exploración
        const exploration = {
            id: dbSession ? dbSession.session_id : `exp_${userId}_${Date.now()}`,
            userId: userId,
            player: player,
            zone: zone,
            status: 'mode_selection', 
            mode: null, 
            startTime: Date.now(),
            lastInteraction: Date.now(),
            stats: {
                distance: 0,
                enemiesDefeated: 0,
                itemsFound: 0,
                passcoinsFound: 0,
                events: [] 
            },
            currentEvent: null,
            fleeAttempts: 3
        };

        this.activeExplorations.set(userId, exploration);

        // Embed de Selección de Modo
        const embed = new EmbedBuilder()
            .setTitle(`🗺️ Exploración: ${zone.name}`)
            .setDescription(`Has llegado a **${zone.name}**.\n¿Cómo deseas explorar esta zona?`)
            .setColor(COLORS.EXPLORATION)
            .addFields(
                { name: '🤖 Automático', value: 'Avanza automáticamente hasta encontrar un evento (Enemigo, Recurso).', inline: true },
                { name: 'uD83DuDD79 Manual', value: 'Avanza paso a paso, explorando cada rincón a tu ritmo.', inline: true }
            )
            .setImage(zone.image || null)
            .setFooter({ text: 'Selecciona un modo para comenzar' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`explore_mode_auto_${exploration.id}`).setLabel('Automático').setStyle(ButtonStyle.Primary).setEmoji('🤖'),
            new ButtonBuilder().setCustomId(`explore_mode_manual_${exploration.id}`).setLabel('Manual').setStyle(ButtonStyle.Secondary).setEmoji('🕹️'),
            new ButtonBuilder().setCustomId(`explore_cancel_${exploration.id}`).setLabel('Cancelar').setStyle(ButtonStyle.Danger).setEmoji('✖️')
        );

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }

    /**
     * Maneja las interacciones de botones de exploración
     */
    async handleInteraction(interaction) {
        const userId = interaction.user.id;
        const exploration = this.activeExplorations.get(userId);

        if (!exploration) {
            await interaction.reply({ content: '⚠️ No tienes una exploración activa o ha expirado.', ephemeral: true });
            return;
        }

        exploration.lastInteraction = Date.now();
        const customId = interaction.customId;

        // Verificar ID de exploración para evitar conflictos
        if (!customId.includes(exploration.id)) {
            // Si es un ID antiguo de otra sesión, ignorar o avisar
            // Pero a veces el ID puede venir de un botón genérico, asumimos que si el usuario tiene exploración activa, es esta.
        }

        try {
            if (customId.startsWith('explore_mode_auto_')) {
                exploration.mode = 'auto';
                exploration.status = 'exploring';
                await this.runAutoStep(interaction, exploration);
            } 
            else if (customId.startsWith('explore_mode_manual_')) {
                exploration.mode = 'manual';
                exploration.status = 'exploring';
                await this.runManualStep(interaction, exploration);
            }
            else if (customId.startsWith('explore_cancel_')) {
                await this.endExploration(interaction, exploration, 'Cancelado por el usuario');
            }
            else if (customId.startsWith('explore_continue_')) {
                // Continuar después de un evento
                if (exploration.mode === 'auto') await this.runAutoStep(interaction, exploration);
                else await this.runManualStep(interaction, exploration);
            }
            else if (customId.startsWith('explore_flee_')) {
                await this.handleFlee(interaction, exploration);
            }
            else if (customId.startsWith('explore_battle_')) {
                await this.startBattle(interaction, exploration);
            }
            else if (customId.startsWith('explore_history_')) {
                await this.showHistory(interaction, exploration);
            }
            else if (customId.startsWith('explore_bag_')) {
                // Abrir inventario usando el comando existente
                const inventoryCommand = this.gameManager.client.commands.get('inventario');
                if (inventoryCommand) {
                    // Ejecutar comando de inventario de forma efímera para no romper flujo
                    await inventoryCommand.execute(interaction, this.gameManager.client, true); // true = ephemeral
                } else {
                    await interaction.reply({ content: '❌ Error: Comando de inventario no encontrado.', ephemeral: true });
                }
            }
            else if (customId.startsWith('explore_info_')) {
                await this.showInfo(interaction, exploration);
            }
        } catch (error) {
            console.error('Error en exploración:', error);
            if (!interaction.replied) await interaction.reply({ content: '❌ Ocurrió un error en la exploración.', ephemeral: true });
        }
    }

    /**
     * Paso de Exploración Automática
     * Avanza una distancia aleatoria hasta encontrar un evento significativo.
     */
    async runAutoStep(interaction, exploration) {
        await interaction.deferUpdate();

        // Simular avance
        const distanceStep = Math.floor(Math.random() * 100) + 50; // 50-150m
        exploration.stats.distance += distanceStep;

        // Generar evento (Forzar evento en Auto, no "Nothing")
        const event = this.generateEvent(exploration, true);
        exploration.currentEvent = event;
        exploration.stats.events.push(`[${new Date().toLocaleTimeString()}] ${event.summary} (${exploration.stats.distance}m)`);

        // Aplicar recompensas inmediatas (si no es combate)
        if (event.type !== 'enemy') {
            await this.applyEventRewards(exploration.player, event);
        }

        // Mostrar Embed
        await this.updateExplorationEmbed(interaction, exploration, 
            `Has avanzado **\`${distanceStep}m\`** automáticamente y te has detenido al encontrar algo.`);
    }

    /**
     * Paso de Exploración Manual
     * Avanza una distancia corta, puede no encontrar nada.
     */
    async runManualStep(interaction, exploration) {
        await interaction.deferUpdate();

        const distanceStep = Math.floor(Math.random() * 20) + 10; // 10-30m
        exploration.stats.distance += distanceStep;

        // Generar evento (Puede ser "Nothing")
        const event = this.generateEvent(exploration, false);
        exploration.currentEvent = event;
        
        if (event.type !== 'nothing') {
            exploration.stats.events.push(`[${new Date().toLocaleTimeString()}] ${event.summary} (\`${exploration.stats.distance}m\`)`);
            if (event.type !== 'enemy') {
                await this.applyEventRewards(exploration.player, event);
            }
        }

        await this.updateExplorationEmbed(interaction, exploration, 
            `Has avanzado **\`${distanceStep}m\`**.`);
    }

    /**
     * Genera un evento aleatorio
     */
    generateEvent(exploration, forceEvent = false) {
        const rand = Math.random();
        let type = 'nothing';
        const player = exploration.player;

        // Lógica de desbloqueo de eventos por nivel
        const canMine = player.level >= 10; 
        const canFish = player.level >= 10; 

        // Probabilidades base (Ajustadas: Más objetos/nada, menos combate)
        // Ahora: Nothing (0.3), Item (0.3), Enemy (0.2), Mining (0.1), Fishing (0.1)
        let probs = { 
            nothing: 0.3, 
            item: 0.3, 
            enemy: 0.2, 
            mining: 0.1, 
            fishing: 0.1 
        };
        
        // Si no puede minar/pescar, redistribuir probabilidad a 'nothing' o 'item'
        if (!canMine) {
            probs.nothing += probs.mining / 2;
            probs.item += probs.mining / 2;
            probs.mining = 0;
        }
        if (!canFish) {
            probs.nothing += probs.fishing / 2;
            probs.item += probs.fishing / 2;
            probs.fishing = 0;
        }

        // Determinar tipo
        if (forceEvent) {
            // Recalcular probabilidades excluyendo 'nothing'
            const total = probs.enemy + probs.item + probs.mining + probs.fishing;
            const r = Math.random() * total;
            let sum = 0;
            
            if ((sum += probs.enemy) >= r) type = 'enemy';
            else if ((sum += probs.item) >= r) type = 'item';
            else if ((sum += probs.mining) >= r) type = 'mining';
            else if ((sum += probs.fishing) >= r) type = 'fishing';
            else type = 'enemy'; // Fallback
        } else {
            let sum = 0;
            for (const [t, p] of Object.entries(probs)) {
                sum += p;
                if (rand < sum) {
                    type = t;
                    break;
                }
            }
        }

        const event = { type, summary: '', description: '', data: null };

        switch (type) {
            case 'mining':
                if (!canMine) { 
                    event.type = 'nothing';
                    event.description = "Viste una veta de mineral, pero no tienes el nivel o herramienta para picarla.";
                    event.summary = "Veta ignorada";
                    break;
                }
                const miningEvent = PassSystem.generateEvent('mining', exploration.zone.miningCap);
                event.data = miningEvent.drop;
                const mEmoji = miningEvent.drop.emoji || miningEvent.emoji;
                event.description = `Encontraste una veta de mineral. ¡Has picado **${miningEvent.drop.amount}x ${miningEvent.drop.name}** ${mEmoji}!`;
                event.summary = `Minaste ${miningEvent.drop.name}`;
                break;

            case 'fishing':
                 if (!canFish) {
                    event.type = 'nothing';
                    event.description = "Viste peces saltando, pero no tienes el nivel o herramienta para pescar.";
                    event.summary = "Peces ignorados";
                    break;
                }
                const fishingEvent = PassSystem.generateEvent('fishing', exploration.zone.fishingCap);
                event.data = fishingEvent.drop;
                const fEmoji = fishingEvent.drop.emoji || fishingEvent.emoji;
                event.description = `Encontraste un banco de peces. ¡Has pescado **${fishingEvent.drop.amount}x ${fishingEvent.drop.name}** ${fEmoji}!`;
                event.summary = `Pescaste ${fishingEvent.drop.name}`;
                break;
            
            case 'enemy':
                let enemyData = null;
                if (exploration.zone.enemyTypes && exploration.zone.enemyTypes.length > 0) {
                    const typeKey = exploration.zone.enemyTypes[Math.floor(Math.random() * exploration.zone.enemyTypes.length)];
                    if (exploration.zone.name.includes('Bosque Inicial')) {
                         enemyData = ENEMIES_BY_ZONE.bosque_inicial.enemies[typeKey];
                    } else {
                         enemyData = this.gameManager.getRandomEnemy(exploration.player.level, exploration.zone.name);
                    }
                } else {
                    enemyData = this.gameManager.getRandomEnemy(exploration.player.level, exploration.zone.name);
                }

                if (!enemyData) enemyData = { name: 'Slime Perdido', level: 1, rarity: 'Mundano', emoji: '💧' };
                
                // 1. Determinar Rareza Real (Usando PassSystem para consistencia con cap de zona)
                // Por defecto, los enemigos pueden tener rareza fija en DB, pero aquí aplicamos la lógica dinámica
                // si queremos que escale. Si el enemigo ya tiene rareza definida (ej. Boss), la respetamos.
                // Pero el usuario quiere "escalas de poder", así que vamos a forzar la rareza dinámica para enemigos genéricos.
                
                const zoneRarityCap = exploration.zone.enemyRarityCap || 'Refinado'; // Default cap para enemigos
                const calculatedRarityKey = PassSystem.calculateRarity(zoneRarityCap.toLowerCase());
                const rarityInfo = RARITIES[calculatedRarityKey];

                // 2. Asignar datos de rareza
                enemyData.rarity = rarityInfo.name;
                enemyData.rarityId = calculatedRarityKey;
                enemyData.emoji = enemyData.emoji || '👾'; // Mantener emoji base del enemigo
                enemyData.multiplier = rarityInfo.multiplier;
                enemyData.color = rarityInfo.color;

                // 3. Nivel variable cercano al jugador
                const variance = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
                enemyData.level = Math.max(1, player.level + variance);

                // 4. Calcular Stats Reales (Escala de Poder)
                // Base: HP = Level * 50, Atk = Level * 5
                const baseHp = enemyData.level * 50;
                const baseAtk = enemyData.level * 5;
                
                // Aplicar Multiplicador de Rareza
                enemyData.hp = Math.floor(baseHp * enemyData.multiplier);
                enemyData.maxHp = enemyData.hp;
                enemyData.attack = Math.floor(baseAtk * enemyData.multiplier);
                
                // XP y Coins también escalan
                enemyData.xpReward = Math.floor((enemyData.level * 10) * enemyData.multiplier);
                enemyData.coinReward = Math.floor((enemyData.level * 5) * enemyData.multiplier);

                event.data = enemyData;
                
                // Formato: EmojiRareza NombreEnemigo EmojiEnemigo | Nvl X
                event.description = `¡*Un Enemigo ha* **aparecido**!\n\n> ${rarityInfo.emoji} **${enemyData.name}** ${enemyData.emoji} | Nvl \`${enemyData.level}\``;
                event.summary = `Encontraste ${enemyData.name}`;
                
                exploration.fleeAttempts = 3;
                break;
            
            case 'item':
                // Generar item aleatorio con rareza
                // Solo items de suelo básicos para zona inicial
                const genericItems = ['Rama Seca', 'Piedra Común', 'Flor Silvestre', 'Baya Roja'];
                const itemName = genericItems[Math.floor(Math.random() * genericItems.length)];
                
                // Rareza siempre mundano para drops básicos de suelo en zonas bajas
                const itemRarityKey = 'mundano';
                const itemRarity = RARITIES[itemRarityKey];
                
                const item = { 
                    name: itemName, 
                    rarity: itemRarity.name, 
                    rarityId: itemRarityKey,
                    type: 'material', 
                    emoji: '📦', 
                    rarityEmoji: itemRarity.emoji
                };
                
                event.data = item;
                event.description = `Encontraste ${item.rarityEmoji} **${item.name}** tirado en el suelo.`;
                event.summary = `Obtuviste ${item.name}`;
                break;

            default:
                event.description = "No encontraste nada interesante, pero el paisaje es bonito.";
                event.summary = "Nada interesante";
        }

        return event;
    }

    async applyEventRewards(player, event) {
        // Dar PassCoins base por explorar
        const coins = Math.floor(Math.random() * 5) + 1;
        
        // Actualizar DB de economía
        await this.gameManager.playerDB.addWalletTransaction(
            player.userId, 
            coins, 
            'earn', 
            'exploration', 
            { session_id: this.activeExplorations.get(player.userId).id, reason: 'step_reward' }
        );

        // Actualizar memoria (player.gold se actualiza via trigger en DB, pero aquí lo hacemos para reactividad inmediata)
        // Si usamos playerDB.getPlayer de nuevo sería mejor, pero por performance:
        player.gold = (player.gold || 0) + coins;
        
        // Actualizar stats de exploración
        const exploration = this.activeExplorations.get(player.userId);
        exploration.stats.passcoinsFound += coins;

        if (event.data) {
            const item = event.data;
            // Usar key si existe, sino generar slug simple
            const itemKey = item.key || item.id || item.name.toLowerCase().replace(/\s+/g, '_');
            
            // Añadir item a DB
            const added = await this.gameManager.playerDB.addItem(player.userId, itemKey, 1);
            
            if (added) {
                exploration.stats.itemsFound++;
                // Log item found
                exploration.stats.events.push(`[${new Date().toLocaleTimeString()}] 📦 Obtuviste ${item.name}`);
            }
        }
        
        // Sincronizar sesión de exploración en DB (actualizar rewards)
        await this.gameManager.playerDB.updateExplorationSession(exploration.id, {
            rewards_summary: {
                coins: exploration.stats.passcoinsFound,
                items_count: exploration.stats.itemsFound,
                enemies_defeated: exploration.stats.enemiesDefeated,
                distance: exploration.stats.distance
            },
            events_log: exploration.stats.events.map(e => ({ type: 'log', message: e, timestamp: new Date().toISOString() }))
        });
        
        // Guardar jugador (para otras stats no DB como XP si se ganara aquí)
        await this.gameManager.playerDB.savePlayer(player);
    }

    async updateExplorationEmbed(interaction, exploration, message = '') {
        const { player, zone, currentEvent, stats } = exploration;
        
        // Datos del jugador para el embed
        const raceId = player.race?.id || player.race; // Manejar si es objeto o string
        const classId = player.class?.id || player.class;

        // Importar datos oficiales para emojis correctos
        const { RACES, BASE_CLASSES } = require('../data/passquirk-official-data');

        // Resolver Raza
        let raceObj = null;
        
        // Prioridad 1: Buscar en OfficialData usando ID o Nombre
        if (raceId) {
            const normalizedId = typeof raceId === 'string' ? raceId.toLowerCase() : (raceId.name || '').toLowerCase();
            // Intentar búsqueda exacta o parcial (ej. "humano" -> "HUMANOS")
            const rKey = Object.keys(RACES).find(k => {
                const key = k.toLowerCase();
                return key === normalizedId || key.includes(normalizedId) || normalizedId.includes(key);
            });
            if (rKey) raceObj = RACES[rKey];
        }

        // Prioridad 2: Usar objeto del jugador (solo si no encontramos oficial)
        if (!raceObj && typeof player.race === 'object') {
            raceObj = player.race;
        }

        if (!raceObj) raceObj = { name: 'Humano', emoji: '👤' };

        // Resolver Clase
        let classObj = null;
        
        // Prioridad 1: Buscar en OfficialData
        if (classId) {
             const normalizedId = typeof classId === 'string' ? classId.toLowerCase() : (classId.name || '').toLowerCase();
            const cKey = Object.keys(BASE_CLASSES).find(k => k.toLowerCase() === normalizedId);
            if (cKey) classObj = BASE_CLASSES[cKey];
        }

        // Prioridad 2: Objeto jugador
        if (!classObj && typeof player.class === 'object') {
            classObj = player.class;
        }

        if (!classObj) classObj = { name: 'Aventurero', emoji: '🗡️' };

        // Fallback de emojis si no están en el objeto
        // IMPORTANTE: Usar siempre raceObj de OfficialData si es posible para evitar emojis de texto antiguo
        let raceEmoji = '👤';
        
        if (raceObj.emoji && raceObj.emoji.startsWith('<:')) {
             raceEmoji = raceObj.emoji; // Emoji válido de Discord
        } else if (raceObj.emoji && !raceObj.emoji.startsWith(':')) {
             raceEmoji = raceObj.emoji; // Emoji unicode probable
        } else {
             // Intentar buscar de nuevo en RACES por nombre si tenemos un emoji roto
             const cleanName = (raceObj.name || 'Humano').toUpperCase();
             const { RACES } = require('../data/passquirk-official-data');
             if (RACES[cleanName]) {
                 raceEmoji = RACES[cleanName].emoji;
             }
        }

        const classEmoji = classObj.emoji || '🗡️';
        const raceName = raceObj.name || raceId || 'Humano';
        const className = classObj.name || classId || 'Aventurero';

        const embed = new EmbedBuilder()
            .setTitle(`🗺️ Explorando: ${zone.name}`)
            .setColor(currentEvent?.type === 'enemy' ? COLORS.DANGER : COLORS.EXPLORATION)
            .setDescription(message + '\n\n' + (currentEvent?.description || ''))
            .setImage(zone.image || null)
            .addFields(
                { name: '👤 Aventurero', value: `**${player.username}**\n${raceEmoji} ${raceName} | ${classEmoji} ${className} | Nvl \`${player.level}\``, inline: false },
                { name: '📊 Estadísticas de Sesión', value: `👣 Distancia: \`${stats.distance}m\`\n⚔️ Enemigos: \`${stats.enemiesDefeated}\`\n📦 Items: \`${stats.itemsFound}\`\n${EMOJIS.GOLD} PassCoins: \`${stats.passcoinsFound}\``, inline: false }
            );

        if (currentEvent?.type === 'enemy') {
            embed.addFields({ name: '⚔️ ¡COMBATE!', value: '¿Qué harás?', inline: false });
        }

        // Botones
        const row = new ActionRowBuilder();

        if (currentEvent?.type === 'enemy') {
            row.addComponents(
                new ButtonBuilder().setCustomId(`explore_battle_${exploration.id}`).setLabel('Combatir').setStyle(ButtonStyle.Danger).setEmoji('⚔️'),
                new ButtonBuilder().setCustomId(`explore_flee_${exploration.id}`).setLabel(`Huir (${exploration.fleeAttempts}/3)`).setStyle(ButtonStyle.Secondary).setEmoji('🏃')
            );
        } else {
            // Botones de navegación
            const label = exploration.mode === 'auto' ? 'Continuar Auto' : 'Avanzar';
            const emoji = exploration.mode === 'auto' ? '🤖' : '➡️';
            
            row.addComponents(
                new ButtonBuilder().setCustomId(`explore_continue_${exploration.id}`).setLabel(label).setStyle(ButtonStyle.Primary).setEmoji(emoji),
                new ButtonBuilder().setCustomId(`explore_bag_${exploration.id}`).setLabel('Mochila').setStyle(ButtonStyle.Secondary).setEmoji('🎒'),
                new ButtonBuilder().setCustomId(`explore_info_${exploration.id}`).setLabel('Info').setStyle(ButtonStyle.Secondary).setEmoji('ℹ️'),
                new ButtonBuilder().setCustomId(`explore_history_${exploration.id}`).setLabel('Historial').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
                new ButtonBuilder().setCustomId(`explore_cancel_${exploration.id}`).setLabel('Salir').setStyle(ButtonStyle.Danger).setEmoji('🏠')
            );
        }

        await interaction.editReply({ embeds: [embed], components: [row] });
    }

    async startBattle(interaction, exploration) {
        // Usar el CombatSystem real si está disponible
        if (this.gameManager.systems.combat) {
            const enemyData = exploration.currentEvent.data;
            if (enemyData) {
                // Iniciar combate real
                const battle = await this.gameManager.systems.combat.startBattle(interaction, exploration.player, enemyData);
                
                // Vincular batalla a exploración
                exploration.currentBattleId = battle.id;
                exploration.status = 'battle';
                
                // Configurar callback de fin de batalla para retornar a exploración
                battle.onEnd = async (i, result) => {
                    await this.handleBattleEnd(i, exploration, result, battle);
                };
                
                return;
            }
        }

        // Fallback a simulación si falla el sistema de combate
        const enemy = exploration.currentEvent.data;
        const player = exploration.player;
        
        // Simular combate simple (50% + stats)
        const winChance = 0.5 + ((player.level - enemy.level) * 0.1);
        const victory = Math.random() < winChance;
        
        if (victory) {
            exploration.stats.enemiesDefeated++;
            const xp = enemy.xpReward || (enemy.level * 10);
            const coins = enemy.coinReward || (enemy.level * 5);
            exploration.stats.passcoinsFound += coins;
            
            // Guardar progreso
            player.gold += coins;
            await this.gameManager.playerDB.addExperience(interaction, player.userId, xp);
            await this.gameManager.playerDB.savePlayer(player);

            await this.updateExplorationEmbed(interaction, exploration, 
                `¡Has derrotado al **${enemy.name}**! (Simulado)\nGanaste \`${xp}\` EXP y ${EMOJIS.GOLD} \`${coins}\` PassCoins.`);
        } else {
            await this.endExploration(interaction, exploration, `Fuiste derrotado por **${enemy.name}**. (Simulado)`);
        }
    }

    async handleBattleEnd(interaction, exploration, result, battle) {
        this.gameManager.systems.combat.activeBattles.delete(battle.player.userId);
        
        if (result === 'victory') {
            // Usar recompensas pre-calculadas en el evento si existen
            // battle.enemy viene de CombatSystem, que se inicializó con enemyData del evento
            // Necesitamos asegurarnos que CombatSystem preservó los datos o los pasamos de otra forma.
            // CombatSystem.startBattle usa: name, level, maxHp, attack, emoji.
            // Es posible que xpReward y coinReward se perdieran si no se guardaron en battle.enemy.
            
            // Vamos a recuperar los datos originales del evento para asegurar consistencia
            const originalEnemyData = exploration.currentEvent.data;
            
            const xp = originalEnemyData.xpReward || (battle.enemy.level * 10);
            const coins = originalEnemyData.coinReward || (battle.enemy.level * 5);
            
            exploration.stats.enemiesDefeated++;
            exploration.stats.passcoinsFound += coins;
            
            await this.gameManager.playerDB.addExperience(interaction, battle.player.userId, xp);
            battle.player.gold += coins;
            await this.gameManager.playerDB.savePlayer(battle.player);

            // Mostrar victoria y botón para seguir explorando
            const embed = new EmbedBuilder()
                .setTitle('🏆 ¡VICTORIA!')
                .setDescription(`Has derrotado a **${battle.enemy.name}**.\n\n**Recompensas:**\n✨ \`+${xp}\` EXP\n${EMOJIS.GOLD} \`+${coins}\` PassCoins`)
                .setColor(COLORS.SUCCESS);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`explore_continue_${exploration.id}`).setLabel('Continuar Explorando').setStyle(ButtonStyle.Success).setEmoji('🗺️')
                );

            exploration.status = 'exploring';
            await interaction.editReply({ embeds: [embed], components: [row] });

        } else if (result === 'fled') {
             exploration.status = 'exploring';
             await this.updateExplorationEmbed(interaction, exploration, "Has logrado huir del combate.");
        } else {
            // Derrota
            await this.endExploration(interaction, exploration, `Has sido derrotado por **${battle.enemy.name}**.`);
        }
    }

    async handleFlee(interaction, exploration) {
        // Asegurar que existe contador, si no (legacy) poner 3
        if (typeof exploration.fleeAttempts === 'undefined') exploration.fleeAttempts = 3;

        if (exploration.fleeAttempts > 0) {
            exploration.fleeAttempts--;
            
            // 50% chance
            const success = Math.random() > 0.5;
            
            if (success) {
                exploration.currentEvent = null;
                // Recuperar botones normales
                await interaction.reply({ content: '💨 ¡Escapaste con éxito!', ephemeral: true });
                await this.updateExplorationEmbed(interaction, exploration, 'Has escapado del peligro.');
            } else {
                // Falló huida
                await interaction.reply({ content: `🚫 ¡No pudiste escapar! Te quedan ${exploration.fleeAttempts} intentos.`, ephemeral: true });
                // Actualizar embed para reflejar intentos restantes en el botón
                await this.updateExplorationEmbed(interaction, exploration, `¡El enemigo bloqueó tu huida! (${exploration.fleeAttempts}/3 intentos)`);
            }
        } else {
            await interaction.reply({ content: '🚫 Ya no puedes huir. ¡Debes luchar!', ephemeral: true });
        }
    }

    async endExploration(interaction, exploration, reason) {
        this.activeExplorations.delete(exploration.userId);
        
        // Actualizar DB
        await this.gameManager.playerDB.updateExplorationSession(exploration.id, {
            status: 'completed',
            end_time: new Date().toISOString(),
            rewards_summary: {
                coins: exploration.stats.passcoinsFound,
                items_count: exploration.stats.itemsFound,
                enemies_defeated: exploration.stats.enemiesDefeated,
                distance: exploration.stats.distance,
                final_reason: reason
            }
        });

        const embed = new EmbedBuilder()
            .setTitle('🗺️ Exploración Finalizada')
            .setDescription(reason)
            .addFields(
                { name: 'Resumen', value: `Distancia: \`${exploration.stats.distance}m\`\nEnemigos: \`${exploration.stats.enemiesDefeated}\`\nItems: \`${exploration.stats.itemsFound}\``, inline: false }
            )
            .setColor(COLORS.SYSTEM.INFO);
            
        await interaction.editReply({ embeds: [embed], components: [] });
        
        // Actualizar estado jugador (limpiar currentZone)
        const player = exploration.player;
        if (player.exploration) player.exploration.active = false;
        await this.gameManager.playerDB.savePlayer(player);
    }

    async showHistory(interaction, exploration) {
        const history = exploration.stats.events.slice(-10).join('\n') || 'No hay eventos recientes.';
        
        const embed = new EmbedBuilder()
            .setTitle('📜 Historial de Exploración')
            .setDescription(history)
            .setColor(COLORS.EXPLORATION)
            .setFooter({ text: 'Últimos 10 eventos' });

        const payload = { embeds: [embed], ephemeral: true };

        // Usar reply ephemeral si no se ha respondido, o followUp si ya se diferió
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(payload);
        } else {
            await interaction.reply(payload);
        }
    }

    async showInfo(interaction, exploration) {
        const embed = new EmbedBuilder()
            .setTitle(`ℹ️ Información de Zona: ${exploration.zone.name}`)
            .addFields(
                { name: 'Dificultad', value: exploration.zone.difficulty, inline: true },
                { name: 'Niveles', value: `\`${exploration.zone.minLevel}\` - \`${exploration.zone.maxLevel}\``, inline: true },
                { name: 'Descripción', value: exploration.zone.description || 'Sin descripción.', inline: false }
            )
            .setColor(COLORS.SYSTEM.INFO);

        const payload = { embeds: [embed], ephemeral: true };

        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(payload);
        } else {
            await interaction.reply(payload);
        }
    }
}

module.exports = ExplorationSystem;
