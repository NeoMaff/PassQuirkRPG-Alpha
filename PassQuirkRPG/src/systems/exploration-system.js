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
                key: 'bosque_inicial', // Clave para DB
                description: 'Un bosque denso y misterioso que rodea Space Central.',
                minLevel: 1,
                maxLevel: 10,
                difficulty: 'Normal',
                image: 'https://media.discordapp.net/attachments/1304192837335613470/1321946864983015484/Bosque_Inicial.png',
                enemyTypes: ['slime_bosque', 'lobo_sombrio'], // Explicito para Mayoi
                miningCap: 'Mundano',
                fishingCap: 'Mundano',
                enemyRarityCap: 'Refinado', // Permite Refinado en zona inicial
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

                // Determinar caps de rareza basados en nivel
                let rarityCap = 'Refinado';
                if (minLevel >= 50) rarityCap = 'Cosmico';
                else if (minLevel >= 40) rarityCap = 'Caos';
                else if (minLevel >= 30) rarityCap = 'Dragon';
                else if (minLevel >= 25) rarityCap = 'Celestial';
                else if (minLevel >= 20) rarityCap = 'Trascendente';
                else if (minLevel >= 15) rarityCap = 'Supremo';
                else if (minLevel >= 10) rarityCap = 'Sublime';

                this.zones[zoneData.name] = {
                    name: zoneData.name,
                    key: key, // Usar key del objeto oficial
                    description: `Zona de nivel ${zoneData.level_range}`,
                    race: zoneData.race, // Añadir restricción de raza
                    minLevel: minLevel, 
                    maxLevel: maxLevel,
                    difficulty: 'Variable',
                    enemyTypes: Object.keys(zoneData.enemies),
                    miningCap: rarityCap,
                    fishingCap: rarityCap,
                    enemyRarityCap: rarityCap,
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

        // ... (Lógica de limpieza anterior se mantiene)
        if (this.activeExplorations.has(userId)) {
            const existing = this.activeExplorations.get(userId);
            if (existing.id && !existing.id.startsWith('exp_')) {
                await this.gameManager.playerDB.updateExplorationSession(existing.id, {
                    status: 'abandoned',
                    end_time: new Date().toISOString(),
                    rewards_summary: {
                        final_reason: 'Reiniciado por nueva exploración'
                    }
                });
            }
            this.activeExplorations.delete(userId);
        }
        const activeSession = await this.gameManager.playerDB.getActiveExplorationSession(userId);
        if (activeSession) {
            await this.gameManager.playerDB.updateExplorationSession(activeSession.id, {
                status: 'abandoned',
                end_time: new Date().toISOString(),
                rewards_summary: { final_reason: 'Reiniciado por nueva exploración' }
            });
        }

        // Resolver zona
        let zone = this.zones[zoneName];
        if (!zone) {
            const key = Object.keys(this.zones).find(k => k.toLowerCase().includes(zoneName.toLowerCase()) || zoneName.toLowerCase().includes(k.toLowerCase()));
            if (key) zone = this.zones[key];
        }

        if (!zone) throw new Error(`La zona "${zoneName}" no existe.`);

        const dbSession = await this.gameManager.playerDB.createExplorationSession(userId, zone.key || 'bosque_inicial', 'manual'); 
        
        const exploration = {
            id: dbSession ? dbSession.id : `exp_${userId}_${Date.now()}`,
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
            fleeAttempts: 3,
            stepsSinceLastFleeRecharge: 0
        };

        this.activeExplorations.set(userId, exploration);

        // NUEVO: Mensaje de bienvenida a la zona sin enemigos iniciales
        const embed = new EmbedBuilder()
            .setTitle(`🗺️ ${zone.name}`) // Nombre zona principal
            .setDescription(`> Llegaste a **${zone.name}** | Zone 1 | Alacrya\n\n` + 
                          `· *Ten en cuenta que pueden aparecerte enemigos de nvl* \`${zone.minLevel}-${zone.maxLevel}\`\n\n` +
                          `**¡Buena Suerte!**`)
            .setColor(COLORS.EXPLORATION)
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
    async handleButtonInteraction(interaction) {
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
            else if (customId.startsWith('explore_mine_')) {
                await this.mineNode(interaction, exploration);
            }
            else if (customId.startsWith('explore_fish_')) {
                await this.fishSpot(interaction, exploration);
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
    /**
     * Aplica regeneración pasiva de vida al caminar
     */
    async applyPassiveRegen(interaction, exploration) {
        const { player } = exploration;
        const maxHp = player.stats.maxHp || 100;
        
        // Si ya está full vida, no hacemos nada
        if (player.currentHp >= maxHp) return false;

        // Regenerar 5% del HP máximo por paso (mínimo 2 HP)
        const regenAmount = Math.max(2, Math.floor(maxHp * 0.05));
        const oldHp = player.currentHp;
        player.currentHp = Math.min(maxHp, player.currentHp + regenAmount);
        
        const healed = player.currentHp - oldHp;
        
        if (healed > 0) {
            // Guardar en DB
            await this.gameManager.playerDB.savePlayer(player);
            return healed;
        }
        return 0;
    }

    processFleeRecharge(exploration) {
        // Asegurar inicialización
        if (typeof exploration.stepsSinceLastFleeRecharge === 'undefined') {
            exploration.stepsSinceLastFleeRecharge = 0;
        }

        // Incrementar contador
        exploration.stepsSinceLastFleeRecharge++;

        // Umbral para recargar: Cada 5 pasos
        const RECHARGE_THRESHOLD = 5;

        if (exploration.stepsSinceLastFleeRecharge >= RECHARGE_THRESHOLD) {
            if (exploration.fleeAttempts < 3) {
                exploration.fleeAttempts++;
                exploration.stepsSinceLastFleeRecharge = 0;
                // Opcional: Notificar o loguear
                // exploration.stats.events.push(`[${new Date().toLocaleTimeString()}] 🏃 Recuperaste fuerzas para huir.`);
            } else {
                // Si ya está al máximo, resetear contador para que no se acumule
                exploration.stepsSinceLastFleeRecharge = 0;
            }
        }
    }

    async runAutoStep(interaction, exploration) {
        await interaction.deferUpdate();

        // Simular avance
        const distanceStep = Math.floor(Math.random() * 100) + 50; // 50-150m
        exploration.stats.distance += distanceStep;

        // Regeneración Pasiva (Recarga "Huir" indirectamente al subir HP)
        const healed = await this.applyPassiveRegen(interaction, exploration);
        const healText = healed > 0 ? ` | 💚 +${healed} HP` : '';

        // Recarga progresiva de huida
        this.processFleeRecharge(exploration);

        // Generar evento (Forzar evento en Auto, no "Nothing")
        const event = this.generateEvent(exploration, true);
        exploration.currentEvent = event;
        
        // LOG: Formato mejorado
        // [HH:MM:SS] Resumen (`Distancia`)
        const logEntry = `[${new Date().toLocaleTimeString()}] ${event.summary} (\`${exploration.stats.distance}m\`${healText})`;
        exploration.stats.events.push(logEntry);

        // Aplicar recompensas inmediatas (si no es combate)
        if (event.type !== 'enemy') {
            await this.applyEventRewards(interaction, exploration.player, event);
        }

        // Mostrar Embed
        await this.updateExplorationEmbed(interaction, exploration, 
            `Has avanzado **\`${distanceStep}m\`** automáticamente${healText} y te has detenido al encontrar algo.`);
    }

    /**
     * Paso de Exploración Manual
     * Avanza una distancia corta, puede no encontrar nada.
     */
    async runManualStep(interaction, exploration) {
        await interaction.deferUpdate();

        const distanceStep = Math.floor(Math.random() * 20) + 10; // 10-30m
        exploration.stats.distance += distanceStep;

        // Regeneración Pasiva
        const healed = await this.applyPassiveRegen(interaction, exploration);
        const healText = healed > 0 ? `\n💚 Recuperaste **${healed} HP** caminando.` : '';

        // Recarga progresiva de huida
        this.processFleeRecharge(exploration);

        // Generar evento (Puede ser "Nothing")
        const event = this.generateEvent(exploration, false);
        exploration.currentEvent = event;
        
        if (event.type !== 'nothing') {
            const logEntry = `[${new Date().toLocaleTimeString()}] ${event.summary} (\`${exploration.stats.distance}m\`)`;
            exploration.stats.events.push(logEntry);
            
            if (event.type !== 'enemy') {
                await this.applyEventRewards(interaction, exploration.player, event);
            }
        }

        await this.updateExplorationEmbed(interaction, exploration, 
            `Has avanzado **\`${distanceStep}m\`**.${healText}`);
    }

    /**
     * Genera un evento aleatorio
     */
    generateEvent(exploration, forceEvent = false) {
        const rand = Math.random();
        let type = 'nothing';
        const player = exploration.player;

        // Lógica de desbloqueo de eventos por nivel
        const canMine = player.level >= 5; 
        const canFish = player.level >= 5; 

        // Probabilidades base (Ajustadas: Más objetos/nada, menos combate)
        // Ahora: Nothing (0.25), Item (0.35), Enemy (0.15), Mining (0.15), Fishing (0.1)
        let probs = { 
            nothing: 0.25, 
            item: 0.35, 
            enemy: 0.15, 
            mining: 0.15, 
            fishing: 0.1 
        };
        
        // Si no puede minar/pescar, YA NO redistribuimos probabilidad.
        // Queremos que el evento ocurra para mostrar el mensaje de "Necesitas herramienta".
        /* 
        if (!canMine) { ... }
        if (!canFish) { ... }
        */

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
                // Si es AUTO, resolver automáticamente
                if (exploration.mode === 'auto') {
                    if (!canMine) { 
                        event.type = 'nothing';
                        event.description = "Viste una veta de mineral, pero no tienes el nivel o herramienta para picarla.";
                        event.summary = "Veta ignorada";
                        break;
                    }
                    const miningEvent = PassSystem.generateEvent('mining', exploration.zone.miningCap);
                    event.data = miningEvent.drop;
                    // Mapear tipo para logs
                    event.type = 'mining'; 
                    const mEmoji = miningEvent.drop.emoji || miningEvent.emoji;
                    event.description = `Encontraste una veta de mineral. ¡Has picado **${miningEvent.drop.amount}x ${miningEvent.drop.name}** ${mEmoji}!`;
                    event.summary = `Minaste *${miningEvent.drop.name}*`;
                } else {
                    // MANUAL: Interactivo
                    const miningDrops = PassSystem.miningDrops['mundano'].slice(0, 3).join(', '); 
                    event.type = 'mining';
                    event.summary = "Veta de Mineral";
                    event.description = "Has encontrado una veta de mineral brillante incrustada en la roca.\n\n**Requisito:** ⛏️ `Pico Mundano`";
                    event.image = 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/events/mining_node.png';
                    event.data = { 
                        canMine: canMine, 
                        requiredTool: 'Pico Mundano',
                        requiredToolKey: 'mundane_pickaxe',
                        possibleDrops: miningDrops
                    };
                }
                break;

            case 'fishing':
                if (exploration.mode === 'auto') {
                     if (!canFish) {
                        event.type = 'nothing';
                        event.description = "Viste peces saltando, pero no tienes el nivel o herramienta para pescar.";
                        event.summary = "Peces ignorados";
                        break;
                    }
                    const fishingEvent = PassSystem.generateEvent('fishing', exploration.zone.fishingCap);
                    event.data = fishingEvent.drop;
                    event.type = 'fishing';
                    const fEmoji = fishingEvent.drop.emoji || fishingEvent.emoji;
                    event.description = `Encontraste un banco de peces. ¡Has pescado **${fishingEvent.drop.amount}x ${fishingEvent.drop.name}** ${fEmoji}!`;
                    event.summary = `Pescaste *${fishingEvent.drop.name}*`;
                } else {
                    // MANUAL: Interactivo
                    const fishingDrops = PassSystem.fishingDrops['mundano'].slice(0, 3).join(', ');
                    event.type = 'fishing';
                    event.summary = "Zona de Pesca";
                    event.description = "Un estanque cristalino brilla ante ti. Se ven sombras moviéndose bajo el agua.\n\n**Requisito:** 🎣 `Caña Mundana`";
                    event.image = 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/events/fishing_spot.png';
                    event.data = { 
                        canFish: canFish, 
                        requiredTool: 'Caña Mundana',
                        requiredToolKey: 'mundane_rod',
                        possibleDrops: fishingDrops
                    };
                }
                break;
            
            case 'enemy':
                let enemyData = null;
                
                // Seleccionar enemigo aleatorio de la zona
                const zoneEnemies = exploration.zone.enemyTypes || [];
                if (zoneEnemies.length > 0) {
                    const enemyKey = zoneEnemies[Math.floor(Math.random() * zoneEnemies.length)];
                    
                    // Buscar datos del enemigo en todas las zonas (ineficiente pero seguro)
                    for (const zoneKey in ENEMIES_BY_ZONE) {
                        const enemies = ENEMIES_BY_ZONE[zoneKey].enemies;
                        if (enemies[enemyKey]) {
                            enemyData = { ...enemies[enemyKey], key: enemyKey };
                            break;
                        }
                    }
                }

                if (!enemyData) {
                    // Fallback genérico
                    enemyData = { name: 'Slime Perdido', level: '1', rarity: 'Mundano', emoji: '💧' };
                }

                // 1. Determinar Nivel Dinámico basado en Zona
                // El nivel será aleatorio entre el rango de la zona (Ej. 1-10 para Mayoi)
                const minLvl = exploration.zone.minLevel || 1;
                const maxLvl = exploration.zone.maxLevel || 10; // Usar tope de zona, no nivel de jugador
                const enemyLvl = Math.floor(Math.random() * (maxLvl - minLvl + 1)) + minLvl;

                // 2. Determinar Rareza Dinámica
                // Cualquier enemigo puede ser de cualquier rareza permitida en la zona
                const rarityKey = this.rollDynamicRarity(exploration.zone, player.level);
                const rarity = RARITIES[rarityKey] || RARITIES['mundano'];

                // 3. Calcular Stats Dinámicos
                // Base + (Crecimiento * Nivel) * Multiplicador Rareza
                const rMult = rarity.multiplier || 1;
                
                // Definir stats base por tipo de enemigo (Simplificado, idealmente en DB)
                let baseHp = 50;
                let baseAtk = 8;
                let hpGrowth = 20; // HP por nivel
                let atkGrowth = 2; // ATK por nivel

                if (enemyData.key === 'lobo_sombrio') {
                    baseHp = 80;
                    baseAtk = 12;
                    hpGrowth = 25;
                    atkGrowth = 3;
                } else if (enemyData.key === 'slime_bosque') {
                    baseHp = 40;
                    baseAtk = 6;
                    hpGrowth = 15;
                    atkGrowth = 1.5;
                }

                // Fórmula de Escalo
                // Stat = (Base + (Growth * (Level - 1))) * RarityMult
                const hp = Math.floor((baseHp + (hpGrowth * (enemyLvl - 1))) * rMult);
                const atk = Math.floor((baseAtk + (atkGrowth * (enemyLvl - 1))) * rMult);

                event.data = {
                    ...enemyData,
                    level: enemyLvl,
                    hp: hp,
                    maxHp: hp,
                    attack: atk,
                    currentHp: hp,
                    rarity: rarity.name, // Usar rareza generada dinámicamente
                    rarityId: rarity.id,
                    emoji: enemyData.emoji
                };

                // Formato Estético solicitado:
                // # Título (implícito en embed)
                // *Narrativa*
                // **Datos**
                // Rareza en bloque de código con emoji

                let rarityEmoji = rarity.emoji;

                event.description = `*Un ${enemyData.emoji} ${enemyData.name} ha emergido de las sombras...*\n\n**Nivel** \`${enemyLvl}\`\n**Rareza** ${rarityEmoji} \`${rarity.name}\``;
                
                // Añadir nombre de zona al objeto enemyData para que CombatSystem lo use
                event.data.zoneName = exploration.zone.name; 
                
                event.summary = `Combate vs ${enemyData.name}`;
                break;

            case 'item':
                // Generar item aleatorio con rareza
                const droppedItem = this.getRandomItem(exploration.zone);
                const itemRarity = RARITIES[droppedItem.rarityId || 'mundano'] || RARITIES['mundano'];
                
                const item = { 
                    name: droppedItem.name, 
                    key: droppedItem.key,
                    rarity: itemRarity.name, 
                    rarityId: itemRarity.id,
                    type: 'material', 
                    emoji: droppedItem.emoji, 
                    rarityEmoji: itemRarity.emoji
                };
                
                event.data = item;
                event.description = `Encontraste ${item.rarityEmoji} **${item.name}** tirado en el suelo.`;
                event.summary = `Obtuviste *${item.name}*`;
                break;

            default:
                event.description = "No encontraste nada interesante, pero el paisaje es bonito.";
                event.summary = "Nada interesante";
        }

        return event;
    }

    /**
     * Determina la rareza de un encuentro basado en la zona y nivel del jugador
     * Las rarezas altas son extremadamente difíciles a niveles bajos
     */
    rollDynamicRarity(zone, playerLevel) {
        // Pesos base (Mundano es el más común)
        // Cuanto más alto el peso, más probable
        let weights = {
            mundano: 1000,
            refinado: 50,   // 5% aprox base
            sublime: 10,    // 1% aprox base
            supremo: 1,     // 0.1% aprox base
            trascendente: 0,
            celestial: 0,
            dragon: 0,
            caos: 0,
            cosmico: 0
        };

        // Ajustar pesos según nivel del jugador (hacer más probables las rarezas altas)
        // Cada 10 niveles, duplicar chance de refinado, etc.
        if (playerLevel >= 5) weights.refinado += 50; // Facilita refinado
        if (playerLevel >= 10) {
            weights.refinado += 100;
            weights.sublime += 20;
        }
        if (playerLevel >= 20) {
            weights.sublime += 50;
            weights.supremo += 10;
        }

        // Aplicar Cap de Zona (Si la zona no permite X rareza, su peso es 0)
        // Cap estricto
        const caps = ['mundano', 'refinado', 'sublime', 'supremo', 'trascendente', 'celestial', 'dragon', 'caos', 'cosmico'];
        const zoneCapIndex = caps.indexOf((zone.enemyRarityCap || 'Mundano').toLowerCase());
        
        for (let i = zoneCapIndex + 1; i < caps.length; i++) {
            weights[caps[i]] = 0;
        }

        // Algoritmo de selección ponderada
        let totalWeight = 0;
        for (let w of Object.values(weights)) totalWeight += w;

        let random = Math.random() * totalWeight;
        
        for (let rarity in weights) {
            if (random < weights[rarity]) return rarity;
            random -= weights[rarity];
        }

        return 'mundano';
    }

    async applyEventRewards(interaction, player, event) {
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

        // Procesar rewards si NO son interactivos (manual mining/fishing se manejan aparte)
        const isInteractive = ['mining', 'fishing'].includes(event.type) && !event.data?.key; // Si no tiene key/id, es metadato
        
        if (event.data && !isInteractive) {
            const item = event.data;
            // Usar key si existe, sino generar slug simple
            const itemKey = item.key || item.id || (item.name ? item.name.toLowerCase().replace(/\s+/g, '_') : 'unknown_item');
            
            // Añadir item a DB
            const added = await this.gameManager.playerDB.addItem(player.userId, itemKey, 1);
            
            if (added) {
                exploration.stats.itemsFound++;
                
                // Ganar XP por encontrar objeto (Poca cantidad)
                const xpGain = 2;
                await this.gameManager.playerDB.addExperience(interaction, player.userId, xpGain);
                // Sincronizar referencia local para visualización inmediata
                player.xp = (player.xp || 0) + xpGain;

                // EVITAR LOG DUPLICADO:
                // Si el evento es 'item' (ya tiene "Obtuviste X"), 'mining' (Minaste X) o 'fishing' (Pescaste X),
                // NO añadimos un log extra aquí. Solo si es un drop secundario inesperado.
                // El evento 'item' ya genera su propio log en el resumen.
                // Pero espera, los logs de exploration.stats.events se usan para el historial.
                // En 'runAutoStep' y 'runManualStep' añadimos `[HH:MM:SS] event.summary` al historial.
                // Si aquí añadimos OTRO log, sale duplicado.
                // SOLUCIÓN: No añadir log aquí si ya está cubierto por el evento principal.
                
                // Solo loguear si NO es el evento principal (ej. bonus drop)
                // O si queremos detalle extra. 
                // Por ahora, comentamos el log explícito de item aquí para evitar duplicidad visual en historial.
                // exploration.stats.events.push(`[${new Date().toLocaleTimeString()}] 📦 Obtuviste *${item.name}*`);

                // LOG PASSYSTEM EVENT (Minería/Pesca)
                if (['mining', 'fishing'].includes(event.type)) {
                    const itemRarity = item.rarity || 'Mundano';
                    await this.gameManager.playerDB.logPassystemEvent(
                        player.userId,
                        event.type,
                        exploration.zone.name, 
                        itemRarity,
                        itemKey,
                        1, 
                        0 
                    );
                }
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
            passcoins_earned: exploration.stats.passcoinsFound,
            passcoins_total: player.gold || player.inventory?.gold || 0,
            events_log: exploration.stats.events.map(e => ({ type: 'log', message: e, timestamp: new Date().toISOString() }))
        });
        
        // Guardar jugador (para otras stats no DB como XP si se ganara aquí)
        await this.gameManager.playerDB.savePlayer(player);
    }

    async updateExplorationEmbed(interaction, exploration, message = '') {
        const { player, zone, currentEvent, stats } = exploration;
        
        // Datos del jugador para el embed
        const classId = player.class?.id || player.class;

        // Importar datos oficiales para emojis correctos
        const { RACES, BASE_CLASSES } = require('../data/passquirk-official-data');

        // Resolver Raza usando Helper unificado
        const raceObj = this.resolveRace(player);
        const raceName = String(raceObj.name || 'Humano').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        let raceEmoji = raceObj.emoji || '👤';

        // Resolver Clase
        let classObj = null;
        
        // Prioridad 1: Buscar en OfficialData
        if (classId) {
             // Normalizar ID (eliminar espacios, guiones bajos, etc)
             const normalizedId = typeof classId === 'string' ? classId.toLowerCase().replace(/\s+/g, '_') : (classId.name || '').toLowerCase().replace(/\s+/g, '_');
            
            const cKey = Object.keys(BASE_CLASSES).find(k => {
                 const baseKey = k.toLowerCase().replace(/\s+/g, '_');
                 return baseKey === normalizedId || baseKey.includes(normalizedId) || normalizedId.includes(baseKey);
            });
            if (cKey) classObj = BASE_CLASSES[cKey];
        }

        // Prioridad 2: Objeto jugador
        if (!classObj && typeof player.class === 'object') {
            classObj = player.class;
        }

        if (!classObj) {
             // Si falla todo, formatear nombre bonito
             const prettyName = String(classId || 'Aventurero').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
             classObj = { name: prettyName, emoji: '🗡️' };
        }

        // Normalizar emoji de clase
        const classEmoji = classObj.emoji || '🗡️';
        
        // Normalizar nombres para visualización (Capitalizar primera letra de cada palabra, quitar guiones)
        const className = String(classObj.name || classId || 'Aventurero').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Calcular XP y Nivel
        const levelSystem = this.gameManager.systems.level;
        const nextXp = levelSystem ? levelSystem.calculateXpForNextLevel(player.level) : 100;
        // Usar solo la barra visual, sin texto extra duplicado. Si nextXp es 0 (error), evitar NaN
        const xpBar = (levelSystem && nextXp > 0) ? levelSystem.generateProgressBar(player.xp, nextXp, 10).split(' ')[0] : `\`XP: ${player.xp}\``;
        const xpPercentage = nextXp > 0 ? Math.floor(((player.xp || 0) / nextXp) * 100) : 0;

        // 1. Embed de Evento / Zona
        const embedEvent = new EmbedBuilder()
            .setTitle(`🗺️ Explorando: ${zone.name}`)
            .setColor(currentEvent?.type === 'enemy' ? COLORS.DANGER : COLORS.EXPLORATION)
            .setDescription((message ? `*${message}*\n\n` : '') + (currentEvent?.description || ''))
            .setImage(zone.image || null)
            .setFooter({ text: `Continente: Alacrya | Zona: ${zone.name}` });

        // 2. Embed de Aventurero
        const embedPlayer = new EmbedBuilder()
            .setTitle(`👤 Aventurero: ${player.username}`)
            .setColor(COLORS.PRIMARY)
            .setThumbnail(player.profileIcon || player.avatar_url || interaction.user.displayAvatarURL())
            .setDescription(`${raceEmoji} **${raceName}** | ${classEmoji} **${className}**`)
            .addFields(
                { name: `${EMOJIS.HP} Salud`, value: `\`${Math.floor(player.stats.hp)}/${Math.floor(player.stats.maxHp)}\``, inline: true },
                { name: `${EMOJIS.MP} Energía`, value: `\`${Math.floor(player.stats.mp)}/${Math.floor(player.stats.maxMp)}\``, inline: true },
                { name: `🌀 Quirk`, value: `\`${player.quirk || 'Ninguno'}\``, inline: true },
                // Nueva Barra de Nivel con porcentaje
                { name: `Nivel ${player.level}`, value: `${xpBar} ${xpPercentage}%`, inline: false }
            );

        // 3. Embed de Estadísticas de Sesión
        const embedStats = new EmbedBuilder()
            .setTitle('📊 Estadísticas de Sesión')
            .setColor(COLORS.SYSTEM.INFO)
            .addFields(
                { name: '👣 Distancia', value: `\`${stats.distance}m\``, inline: true },
                { name: '⚔️ Enemigos', value: `\`${stats.enemiesDefeated}\``, inline: true },
                { name: '📦 Items', value: `\`${stats.itemsFound}\``, inline: true },
                { name: `${EMOJIS.GOLD} PassCoins`, value: `\`${stats.passcoinsFound}\` (Total: \`${player.gold || player.inventory?.gold || 0}\`)`, inline: true }
            );

        if (currentEvent?.type === 'enemy') {
            embedEvent.addFields({ name: '⚔️ ¡COMBATE!', value: '¿Qué harás?', inline: false });
        }

        // Botones
        const row = new ActionRowBuilder();

        if (currentEvent?.type === 'enemy') {
            row.addComponents(
                new ButtonBuilder().setCustomId(`explore_battle_${exploration.id}`).setLabel('Combatir').setStyle(ButtonStyle.Danger).setEmoji('⚔️'),
                new ButtonBuilder().setCustomId(`explore_flee_${exploration.id}`).setLabel(`Huir (${exploration.fleeAttempts}/3)`).setStyle(ButtonStyle.Secondary).setEmoji('🏃')
            );
        } else if (currentEvent?.type === 'mining') {
            // Añadir info de drops al embed
            if (currentEvent.data.possibleDrops) {
                embedEvent.addFields({ name: '⛏️ Objetos Posibles', value: currentEvent.data.possibleDrops, inline: false });
            }
            
            row.addComponents(
                new ButtonBuilder().setCustomId(`explore_mine_${exploration.id}`).setLabel('Picar').setStyle(ButtonStyle.Success).setEmoji('⛏️'),
                new ButtonBuilder().setCustomId(`explore_continue_${exploration.id}`).setLabel('Ignorar').setStyle(ButtonStyle.Secondary).setEmoji('➡️')
            );
        } else if (currentEvent?.type === 'fishing') {
            if (currentEvent.data.possibleDrops) {
                embedEvent.addFields({ name: '🎣 Objetos Posibles', value: currentEvent.data.possibleDrops, inline: false });
            }

            row.addComponents(
                new ButtonBuilder().setCustomId(`explore_fish_${exploration.id}`).setLabel('Pescar').setStyle(ButtonStyle.Success).setEmoji('🎣'),
                new ButtonBuilder().setCustomId(`explore_continue_${exploration.id}`).setLabel('Ignorar').setStyle(ButtonStyle.Secondary).setEmoji('➡️')
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

        // Intentar editReply primero que es más robusto para interacciones diferidas
        try {
             await interaction.editReply({ embeds: [embedEvent, embedPlayer, embedStats], components: [row] });
        } catch (e) {
             // Fallback si editReply falla (ej. mensaje borrado o token inválido), intentar editar mensaje directo si existe
             if (interaction.message) {
                 try {
                    await interaction.message.edit({ embeds: [embedEvent, embedPlayer, embedStats], components: [row] });
                 } catch (err) {
                     console.error("Error final editando mensaje de exploración:", err);
                 }
             }
        }
    }

    async startBattle(interaction, exploration) {
        // Usar el CombatSystem real si está disponible
        if (this.gameManager.systems.combat) {
            const enemyData = exploration.currentEvent.data;
            if (enemyData) {
                // Iniciar combate real
                const battle = await this.gameManager.systems.combat.startBattle(interaction, exploration.player, enemyData, exploration.zone.name);
                
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
            // Recuperar datos originales del evento para consistencia
            const originalEnemyData = exploration.currentEvent.data;
            const xp = originalEnemyData.xpReward || (battle.enemy.level * 10);
            const coins = originalEnemyData.coinReward || (battle.enemy.level * 5);
            
            exploration.stats.enemiesDefeated++;
            exploration.stats.passcoinsFound += coins;
            
            // Drop de objetos (30% probabilidad) usando getEnemyDrop
            let itemDropText = "";
            // Pasamos el enemigo original y la zona para determinar el drop correcto
            const droppedItem = this.getEnemyDrop(battle.enemy, exploration.zone);
            
            if (droppedItem) {
                // Añadir item a DB
                await this.gameManager.playerDB.addItem(battle.player.userId, droppedItem.key, 1);
                exploration.stats.itemsFound++;
                
                // Formato de drop con rareza
                const rarityEmoji = droppedItem.rarityEmoji || '⚪';
                itemDropText = `\n📦 **Botín:** ${rarityEmoji} ${droppedItem.name}`;
                
                // Log en historial con formato estético
                // [HH:MM:SS] Derrotaste *Enemigo* (+XP, +Coins)
                // [HH:MM:SS] 📦 Obtuviste *Item* (Botín)
                exploration.stats.events.push(`[${new Date().toLocaleTimeString()}] ⚔️ Derrotaste *${battle.enemy.name}*`);
                exploration.stats.events.push(`[${new Date().toLocaleTimeString()}] 📦 Obtuviste *${droppedItem.name}* (Botín)`);
            } else {
                // Log solo de victoria
            exploration.stats.events.push(`[${new Date().toLocaleTimeString()}] ⚔️ Derrotaste *${battle.enemy.name}*`);
        }

        // IMPORTANTE: Usar addExperience para que salte el check de nivel
        await this.gameManager.playerDB.addExperience(interaction, battle.player.userId, xp);
        
        // Recargar jugador para tener la XP y Nivel actualizados antes de guardar el oro
        const updatedPlayer = await this.gameManager.playerDB.getPlayer(battle.player.userId);
        updatedPlayer.gold = (updatedPlayer.gold || 0) + coins;
        
        // Sincronizar objeto player de exploración con el actualizado
        exploration.player.level = updatedPlayer.level;
        exploration.player.xp = updatedPlayer.xp;
        exploration.player.gold = updatedPlayer.gold;
        exploration.player.stats = updatedPlayer.stats; // Stats suben al subir nivel

        await this.gameManager.playerDB.savePlayer(updatedPlayer);

        // LOG COMBAT
            await this.gameManager.playerDB.logCombat(
                battle.player.userId,
                battle.enemy,
                'victory',
                { xp, coins, items: droppedItem ? [droppedItem] : [] },
                exploration.zone.key || exploration.zone.name,
                battle.turn
            );

            // Mostrar victoria y botón para seguir explorando
            const embed = new EmbedBuilder()
                .setTitle('🏆 ¡VICTORIA!')
                .setDescription(`Has derrotado a **${battle.enemy.name}**.\n\n**Recompensas:**\n✨ \`+${xp}\` EXP\n${EMOJIS.GOLD} \`+${coins}\` PassCoins${itemDropText}`)
                .setColor(COLORS.SUCCESS);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`explore_continue_${exploration.id}`).setLabel('Continuar Explorando').setStyle(ButtonStyle.Success).setEmoji('🗺️')
                );

            exploration.status = 'exploring';
            await interaction.editReply({ embeds: [embed], components: [row] });

        } else if (result === 'fled') {
             // LOG COMBAT (FLED)
             await this.gameManager.playerDB.logCombat(
                battle.player.userId,
                battle.enemy,
                'fled',
                {},
                exploration.zone.key || exploration.zone.name,
                battle.turn
             );

             exploration.status = 'exploring';
             exploration.stats.events.push(`[${new Date().toLocaleTimeString()}] 🏃 Escapaste de *${battle.enemy.name}*`);
             await this.updateExplorationEmbed(interaction, exploration, "Has logrado huir del combate.");
        } else {
            // Derrota
            // LOG COMBAT (DEFEAT)
            await this.gameManager.playerDB.logCombat(
                battle.player.userId,
                battle.enemy,
                'defeat',
                {},
                exploration.zone.key || exploration.zone.name,
                battle.turn
             );

            exploration.stats.events.push(`[${new Date().toLocaleTimeString()}] 💀 Derrotado por *${battle.enemy.name}*`);
            await this.endExploration(interaction, exploration, `Has sido derrotado por **${battle.enemy.name}**.`);
        }
    }

    async handleFlee(interaction, exploration) {
        // Asegurar que existe contador, si no (legacy) poner 3
        if (typeof exploration.fleeAttempts === 'undefined') exploration.fleeAttempts = 3;

        if (exploration.fleeAttempts > 0) {
            // Calcular probabilidad dinámica (Igual que en CombatSystem)
            // Base: 50%
            // Si HP < 30%: Probabilidad baja linealmente
            const maxHp = exploration.player.stats.maxHp || 100;
            const currentHp = exploration.player.stats.hp || exploration.player.currentHp || maxHp;
            const hpPercent = currentHp / maxHp;
            
            let fleeChance = 0.5;
            if (hpPercent < 0.3) {
                fleeChance = 0.2 + hpPercent; // 20% min
            }

            const success = Math.random() < fleeChance;
            exploration.fleeAttempts--;
            
            if (success) {
                exploration.currentEvent = null;
                // Recuperar botones normales
                await interaction.reply({ content: '💨 ¡Escapaste con éxito!', ephemeral: true });
                await this.updateExplorationEmbed(interaction, exploration, 'Has escapado del peligro.');
            } else {
                // Falló huida
                const probPct = Math.floor(fleeChance * 100);
                await interaction.reply({ content: `🚫 ¡No pudiste escapar! (Prob: ${probPct}%) Te quedan ${exploration.fleeAttempts} intentos.`, ephemeral: true });
                // Actualizar embed para reflejar intentos restantes en el botón
                await this.updateExplorationEmbed(interaction, exploration, `¡El enemigo bloqueó tu huida! (${exploration.fleeAttempts}/3 intentos)`);
            }
        } else {
            await interaction.reply({ content: '🚫 Ya no puedes huir. ¡Debes luchar!', ephemeral: true });
        }
    }

    /**
     * Helper para resolver la raza del jugador
     */
    resolveRace(player) {
        const { RACES } = require('../data/passquirk-official-data');
        const raceId = player.race?.id || player.race;
        let raceObj = null;
        
        if (raceId) {
            const normalizedId = typeof raceId === 'string' ? raceId.toLowerCase() : (raceId.name || '').toLowerCase();
            const rKey = Object.keys(RACES).find(k => {
                const key = k.toLowerCase();
                return key === normalizedId || key.includes(normalizedId) || normalizedId.includes(key);
            });
            if (rKey) raceObj = RACES[rKey];
        }

        if (!raceObj && typeof player.race === 'object') raceObj = player.race;
        if (!raceObj) raceObj = { name: 'Humano', emoji: '👤' };

        return raceObj;
    }

    async mineNode(interaction, exploration) {
        // 0. Diferir respuesta inmediatamente para evitar timeout
        if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ ephemeral: true });

        const data = exploration.currentEvent?.data;
        
        // 1. Validar datos del evento
        if (!data) {
            await interaction.editReply({ content: '❌ Error: Datos del evento no encontrados.' });
            return;
        }

        if (data.mined) {
             await interaction.editReply({ content: '⚠️ Ya has picado esta veta.' });
             return;
        }

        // 2. Verificar Herramienta en Inventario
        const toolKey = data.requiredToolKey || 'mundane_pickaxe';
        const inventory = await this.gameManager.playerDB.getInventory(exploration.player.userId);
        const hasTool = inventory.some(i => i.item_key === toolKey && i.quantity > 0);

        if (!hasTool) {
            const race = this.resolveRace(exploration.player);
            const raceName = race.name || 'Humano';
            
            await interaction.editReply({ 
                content: `🚫 **¡No tienes un Pico de ${raceName}!**\nNecesitas esta herramienta para picar. Puedes comprarla en la Tienda (\`/tienda\`) al alcanzar el **Nivel 5**.\n\nPulsa "Ignorar" para continuar tu camino.` 
            });
            return;
        }

        // 3. Verificar Nivel
        if (!data.canMine) {
            await interaction.editReply({ 
                content: `🚫 **Nivel Insuficiente**\nNecesitas ser **Nivel 5** para usar el pico.` 
            });
            return;
        }

        // Ejecutar minería
        const miningEvent = PassSystem.generateEvent('mining', exploration.zone.miningCap || 'mundano');
        const droppedItem = miningEvent.drop;
        
        if (droppedItem) {
            // Añadir a inventario
            await this.gameManager.playerDB.addItem(exploration.player.userId, droppedItem.key, droppedItem.amount);
            exploration.stats.itemsFound++;
            
            // Log
            const mEmoji = droppedItem.emoji || '⛏️';
            exploration.stats.events.push(`[${new Date().toLocaleTimeString()}] ⛏️ Minaste *${droppedItem.name}*`);
            
            // Marcar como minado
            data.mined = true;

            // Actualizar embed
            await this.updateExplorationEmbed(interaction, exploration, 
                `¡Has picado la veta con éxito!\nObtuviste: **${droppedItem.amount}x ${droppedItem.name}** ${mEmoji}`);
            
            // Responder efímero
            await interaction.editReply({ content: `⛏️ ¡Conseguiste **${droppedItem.name}**!` });
        } else {
            await interaction.editReply({ content: 'La veta se rompió y no obtuviste nada útil.' });
            await this.updateExplorationEmbed(interaction, exploration, "La veta se desmoronó sin dar minerales.");
        }
    }

    async fishSpot(interaction, exploration) {
        // 0. Diferir respuesta inmediatamente
        if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ ephemeral: true });

        const data = exploration.currentEvent?.data;
        
        if (!data) {
            await interaction.editReply({ content: '❌ Error: Datos del evento no encontrados.' });
            return;
        }

        if (data.fished) {
             await interaction.editReply({ content: '⚠️ Ya has pescado en este lugar.' });
             return;
        }

        // Verificar Herramienta
        const toolKey = data.requiredToolKey || 'mundane_rod';
        const inventory = await this.gameManager.playerDB.getInventory(exploration.player.userId);
        const hasTool = inventory.some(i => i.item_key === toolKey && i.quantity > 0);

        if (!hasTool) {
            const race = this.resolveRace(exploration.player);
            const raceName = race.name || 'Humano';

            await interaction.editReply({ 
                content: `🚫 **¡No tienes una Caña de ${raceName}!**\nNecesitas esta herramienta para pescar. Puedes comprarla en la Tienda (\`/tienda\`) al alcanzar el **Nivel 5**.\n\nPulsa "Ignorar" para continuar tu camino.` 
            });
            return;
        }

        if (!data.canFish) {
            await interaction.editReply({ 
                content: `🚫 **Nivel Insuficiente**\nNecesitas ser **Nivel 5** para usar la caña.` 
            });
            return;
        }

        const fishingEvent = PassSystem.generateEvent('fishing', exploration.zone.fishingCap || 'mundano');
        const droppedItem = fishingEvent.drop;
        
        if (droppedItem) {
            await this.gameManager.playerDB.addItem(exploration.player.userId, droppedItem.key, droppedItem.amount);
            exploration.stats.itemsFound++;
            
            const fEmoji = droppedItem.emoji || '🐟';
            exploration.stats.events.push(`[${new Date().toLocaleTimeString()}] 🎣 Pescaste *${droppedItem.name}*`);
            
            data.fished = true;

            await this.updateExplorationEmbed(interaction, exploration, 
                `¡Has pescado algo!\nObtuviste: **${droppedItem.amount}x ${droppedItem.name}** ${fEmoji}`);
            
            await interaction.editReply({ content: `🎣 ¡Conseguiste **${droppedItem.name}**!` });
        } else {
             await interaction.editReply({ content: 'El pez se escapó...' });
             await this.updateExplorationEmbed(interaction, exploration, "No lograste pescar nada.");
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
        
        // Asegurar que respondemos correctamente (editReply o reply)
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed], components: [] });
            } else {
                await interaction.reply({ embeds: [embed], components: [] });
            }
        } catch (error) {
            console.error('Error al enviar respuesta de fin de exploración:', error);
            // Si falla la interacción original, intentar enviar mensaje al canal
            if (interaction.channel) {
                await interaction.channel.send({ content: `<@${exploration.userId}>`, embeds: [embed] });
            }
        }
        
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

    getEnemyDrop(enemy, zone) {
        // Lógica de drop específica por enemigo/zona
        // TODO: Mover esto a una tabla de loot en DB o archivo de configuración
        
        const dropChance = 0.4; // 40% de probabilidad base
        if (Math.random() > dropChance) return null;

        let possibleDrops = [];

        // Drops específicos por nombre de enemigo (simplificado)
        if (enemy.name.includes('Slime')) {
             possibleDrops.push({ name: 'Gelatina de Slime', key: 'gelatina_slime', rarityId: 'mundano', emoji: '🟢' });
        } else if (enemy.name.includes('Lobo')) {
             possibleDrops.push({ name: 'Piel de Lobo', key: 'piel_lobo', rarityId: 'refinado', emoji: '🐺' });
             possibleDrops.push({ name: 'Colmillo de Lobo', key: 'colmillo_lobo', rarityId: 'mundano', emoji: '🦷' });
        } else {
             // Fallback genérico de zona
             return this.getRandomItem(zone);
        }
        
        const selectedDrop = possibleDrops[Math.floor(Math.random() * possibleDrops.length)];
        
        // Construir objeto item completo
        const rarity = RARITIES[selectedDrop.rarityId] || RARITIES['mundano'];
        return {
            name: selectedDrop.name,
            key: selectedDrop.key,
            rarity: rarity.name,
            rarityId: rarity.id,
            emoji: selectedDrop.emoji,
            rarityEmoji: rarity.emoji,
            type: 'material'
        };
    }

    getRandomItem(zone) {
        // Mapeo de items generados a claves reales de DB
        // Items actualizados en DB:
        // - rama_seca (Mundano, Bosque Inicial, Stock: 99)
        // - piedra_pequena (Mundano, Bosque Inicial)
        // - hierba_medicinal (Mundano)
        // - piel_lobo (Refinado)
        
        // Definir pools de items por zona
        let itemsList = [];

        if (zone && (zone.key === 'bosque_inicial' || zone.name.includes('Bosque Inicial'))) {
            // Items específicos de Mayoi (Bosque Inicial)
            itemsList = [
                { name: 'Rama Seca', key: 'rama_seca', rarityId: 'mundano', emoji: '🪵' },
                { name: 'Piedra Pequeña', key: 'piedra_pequena', rarityId: 'mundano', emoji: '🪨' },
                { name: 'Hierba Medicinal', key: 'hierba_medicinal', rarityId: 'mundano', emoji: '🌿' },
                { name: 'Piel de Lobo', key: 'piel_lobo', rarityId: 'refinado', emoji: '🐺' }, // Drop raro
                { name: 'Escama Común', key: 'escama_comun', rarityId: 'mundano', emoji: '🐟' }
            ];
        } else {
            // Pool genérico o fallback
            itemsList = [
                { name: 'Rama Seca', key: 'rama_seca', rarityId: 'mundano', emoji: '🪵' },
                { name: 'Piedra Pequeña', key: 'piedra_pequena', rarityId: 'mundano', emoji: '🪨' },
                { name: 'Fragmento de Piedra', key: 'fragmento_piedra', rarityId: 'mundano', emoji: '🪨' }
            ];
        }

        return itemsList[Math.floor(Math.random() * itemsList.length)];
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