const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { OfficialEmbedBuilder, EMOJIS, COLORS } = require('../utils/embedStyles');
const OFFICIAL_DATA = require('../data/passquirk-official-data');
const RARITIES = require('../data/rarities');

/**
 * ⚔️ Sistema de Combate para PassQuirk RPG
 * Maneja batallas por turnos interactivas.
 */
class CombatSystem {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.activeBattles = new Map();
    }

    /**
     * Maneja interacciones de botones del sistema de combate
     * @param {Object} interaction - Interacción de botón
     */
    async handleButtonInteraction(interaction) {
        const customId = interaction.customId;
        
        if (customId === 'combat_attack') {
            await this.processAction(interaction, 'attack');
            return true;
        }
        
        if (customId === 'combat_skill') {
            // Fallback legacy, pero ahora usamos botones directos
            // Si se llega aquí, redirigir o mostrar menú
            await this.handleSkillSelection(interaction);
            return true;
        }

        // Manejar botones de skills directos (combat_skill_basic, etc)
        if (customId.startsWith('combat_skill_')) {
            const skillType = customId.replace('combat_skill_', ''); // basic, power, special
            await this.processAction(interaction, 'skill', skillType);
            return true;
        }

        if (customId.startsWith('use_skill_')) {
            const skillKey = customId.split('_')[2]; // use_skill_basic
            await this.processAction(interaction, 'skill', skillKey);
            return true;
        }
        
        if (customId === 'combat_inventory') {
            await this.handleInventorySelection(interaction);
            return true;
        }

        if (customId.startsWith('use_item_')) {
            // Formato: use_item_ITEMKEY
            // Extraer itemKey correctamente (puede tener guiones bajos)
            const itemKey = customId.replace('use_item_', '');
            await this.processAction(interaction, 'item', itemKey);
            return true;
        }

        if (customId === 'combat_back') {
            // Volver al menú principal de combate (cancelar selección de habilidad/item)
            const battle = this.activeBattles.get(interaction.user.id);
            if (battle) await this.updateBattleEmbed(interaction, battle);
            return true;
        }
        
        if (customId === 'combat_flee') {
            await this.processAction(interaction, 'flee');
            return true;
        }

        return false;
    }

    /**
     * Inicia un combate entre jugador y enemigo
     */
    async startBattle(interaction, player, enemyData, zoneName = 'Desconocida') {
        // Asegurar que la clase esté bien definida (Fix "undefined" class)
        if (!player.class || (typeof player.class === 'object' && !player.class.name && !player.class.id) || player.class === 'undefined') {
             // Intentar recuperar clase desde DB si falla
             try {
                 const dbPlayer = await this.gameManager.playerDB.getPlayer(player.userId);
                 if (dbPlayer && dbPlayer.class) {
                     player.class = dbPlayer.class;
                 }
             } catch (e) {
                 console.error('Error recuperando clase de jugador en startBattle:', e);
             }
        }

        const battleId = `battle_${player.userId}_${Date.now()}`;

        // Si zoneName es una key (ej: bosque_inicial), intentar buscar nombre real
        // IMPORTANTE: Aquí deberíamos consultar DB o memoria de zonas si queremos el nombre bonito siempre.
        // Por ahora, ExplorationSystem ya debería pasar el nombre bonito.
        
        // Estructura de batalla
        const battle = {
            id: battleId,
            player: {
                ...player,
                currentHp: player.stats.hp,
                currentMp: player.stats.mp
            },
            enemy: {
                name: enemyData.name,
                level: enemyData.level,
                maxHp: enemyData.hp || (enemyData.level * 50), // Fallback HP
                currentHp: enemyData.hp || (enemyData.level * 50),
                attack: enemyData.attack || (enemyData.level * 5),
                emoji: enemyData.emoji || '👾',
                rarity: enemyData.rarity || 'Mundano',
                zoneName: zoneName
            },
            log: [],
            turn: 1,
            status: 'active',
            fleeAttempts: 3, // 3 Intentos iniciales
            // Callback placeholders
            onEnd: null
        };

        this.activeBattles.set(player.userId, battle);
        
        // Mostrar interfaz inicial
        await this.updateBattleEmbed(interaction, battle);
        
        return battle;
    }

    /**
     * Muestra el menú de selección de habilidades (IN-PLACE)
     */
    async handleSkillSelection(interaction) {
        const userId = interaction.user.id;
        const battle = this.activeBattles.get(userId);
        if (!battle) return;

        let playerClass = battle.player.class;
        let classKey = typeof playerClass === 'string' ? playerClass : (playerClass?.name || playerClass?.id || 'Aventurero');
        
        // Búsqueda flexible (igual que en updateBattleEmbed)
        let classData = OFFICIAL_DATA.BASE_CLASSES[classKey];
        if (!classData) {
             const upperKey = classKey.toUpperCase();
             classData = OFFICIAL_DATA.BASE_CLASSES[upperKey];
             if (!classData) {
                 classData = OFFICIAL_DATA.BASE_CLASSES[upperKey.replace(/_/g, ' ')] || 
                             OFFICIAL_DATA.BASE_CLASSES[upperKey.replace(/\s+/g, '_')];
             }
        }
        
        // Si no hay clase o habilidades, mostrar mensaje IN-PLACE con botón volver
        if (!classData || !classData.abilities) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.WARNING)
                .setDescription('❌ No se encontraron habilidades para tu clase.');
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('combat_back').setLabel('Volver').setStyle(ButtonStyle.Secondary).setEmoji('↩️')
            );
            
            await interaction.update({ embeds: [embed], components: [row], files: [] });
            return;
        }

        const row = new ActionRowBuilder();
        const abilities = classData.abilities;
        
        // Verificar desbloqueos y crear botones
        for (const [key, skill] of Object.entries(abilities)) {
            if (battle.player.level >= (skill.unlockLevel || 1)) {
                const canAfford = battle.player.currentMp >= (skill.cost || 0);
                
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`use_skill_${key}`)
                        .setLabel(`${skill.name} (${skill.cost || 0} MP)`)
                        .setStyle(key === 'special' ? ButtonStyle.Success : ButtonStyle.Primary)
                        .setEmoji(skill.emoji || '✨')
                        .setDisabled(!canAfford)
                );
            }
        }

        // Si no hay botones (ninguna desbloqueada?), mostrar solo volver
        if (row.components.length === 0) {
             row.addComponents(
                new ButtonBuilder().setCustomId('combat_back').setLabel('Volver').setStyle(ButtonStyle.Secondary).setEmoji('↩️')
            );
        } else {
            // Añadir botón volver en nueva fila si es necesario o en la misma si cabe
            if (row.components.length >= 5) {
                // TODO: Manejar múltiples filas si hay muchas skills
            } else {
                row.addComponents(
                    new ButtonBuilder().setCustomId('combat_back').setLabel('Volver').setStyle(ButtonStyle.Secondary).setEmoji('↩️')
                );
            }
        }

        // Construir descripción con números en code blocks
        let desc = `Selecciona una habilidad para usar.\nMP Actual: **${battle.player.currentMp}/${battle.player.stats.maxMp}** 💧\n\n`;
        for (const [key, skill] of Object.entries(abilities)) {
            if (battle.player.level >= (skill.unlockLevel || 1)) {
                desc += `**${skill.emoji} ${skill.name}**\n`;
                desc += `Daño: \`${skill.damage}\` | Coste: \`${skill.cost} MP\`\n`;
                if (skill.effect) desc += `Efecto: ${skill.effect}\n`;
                desc += `\n`;
            }
        }

        const embed = new OfficialEmbedBuilder()
            .setOfficialStyle('combat')
            .setOfficialTitle(`Habilidades de ${battle.player.username}`, classData.emoji)
            .setOfficialDescription(desc);

        await interaction.update({ embeds: [embed.getEmbed()], components: [row], files: [] });
    }

    /**
     * Muestra el menú de inventario (Solo usables)
     */
    async handleInventorySelection(interaction) {
        const userId = interaction.user.id;
        const battle = this.activeBattles.get(userId);
        if (!battle) return;

        // Obtener inventario actualizado desde DB
        const rawInventory = await this.gameManager.playerDB.getInventory(userId);
        
        // Mapear a formato usable
        const items = rawInventory.map(entry => {
            const itemData = entry.item || {};
            return {
                id: entry.item_key,
                name: itemData.name || entry.item_key.replace(/_/g, ' '),
                quantity: entry.quantity,
                type: itemData.category || 'unknown',
                emoji: '📦' // Emoji por defecto, se podría mejorar con mapa
            };
        });

        // Filtrar items usables (consumables o específicos conocidos)
        const knownUsables = ['health_potion', 'mana_potion', 'hierba_medicinal'];
        const usableItems = items.filter(i => 
            (i.type === 'consumable' || knownUsables.includes(i.id)) && i.quantity > 0
        );

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('🎒 Mochila de Batalla')
            .setDescription(usableItems.length > 0 
                ? 'Selecciona un objeto para usar.' 
                : 'No tienes objetos útiles en combate.');

        const row = new ActionRowBuilder();

        // Añadir botones para items (Limitado a 4 + Volver)
        usableItems.slice(0, 4).forEach(item => {
            let emoji = item.emoji;
            // Asignar emojis específicos
            if (item.id === 'health_potion') emoji = '🧪';
            if (item.id === 'mana_potion') emoji = '💙';
            if (item.id === 'hierba_medicinal') emoji = '🌿';

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`use_item_${item.id}`)
                    .setLabel(`${item.name} (${item.quantity})`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(emoji)
            );
        });

        row.addComponents(
            new ButtonBuilder().setCustomId('combat_back').setLabel('Volver').setStyle(ButtonStyle.Secondary).setEmoji('↩️')
        );

        await interaction.update({ embeds: [embed], components: [row], files: [] });
    }

    /**
     * Procesa una acción de combate
     */
    async processAction(interaction, action, skillKey = null) {
        const userId = interaction.user.id;
        const battle = this.activeBattles.get(userId);

        if (!battle) {
            await interaction.reply({ content: '❌ No hay batalla activa.', ephemeral: true });
            return;
        }

        // Deferir si no es una interacción de componente que ya requiere respuesta inmediata
        // (En este caso, handleSkillSelection ya hizo update, pero para ataques directos necesitamos defer)
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferUpdate();
        }

        // Lógica de huida
        if (action === 'flee') {
            // Calcular probabilidad dinámica basada en HP
            // Base: 50%
            // Si HP < 30%: Probabilidad baja drásticamente (hasta 20%)
            const maxHp = battle.player.stats.maxHp;
            const currentHp = battle.player.currentHp;
            const hpPercent = currentHp / maxHp;
            
            let fleeChance = 0.5;
            
            if (hpPercent < 0.3) {
                // Escalar linealmente de 20% (a 0 HP) a 50% (a 30% HP)
                // Formula: 0.2 + (hpPercent * 1.0) -> 0.2 + 0.3 = 0.5
                fleeChance = 0.2 + hpPercent; 
                // Si tienes 1% HP -> 0.21 (21%)
                // Si tienes 29% HP -> 0.49 (49%)
            }

            // Log para debug (opcional)
            // console.log(`Flee Chance: ${fleeChance} (HP: ${hpPercent})`);

            const success = Math.random() < fleeChance;
            
            if (success) {
                if (battle.onEnd) await battle.onEnd(interaction, 'fled');
                else await this.endBattle(interaction, battle, 'fled');
                return;
            }
            
            battle.fleeAttempts--;
            battle.log.push(`🏃 Intentaste huir pero fallaste. (Prob: ${Math.floor(fleeChance * 100)}%)`);
        }

        // Turno Jugador (Ataque Básico, Habilidad o Item)
        if (action === 'attack' || action === 'skill' || action === 'item') {
            let playerDamage = 0;
            let playerMsg = '';
            let selfHeal = 0;
            let mpRestore = 0;

            if (action === 'item' && skillKey) { // skillKey aquí es itemKey
                const itemKey = skillKey;
                
                // Verificar existencia del item
                const inventory = await this.gameManager.playerDB.getInventory(userId);
                const item = inventory.find(i => i.item_key === itemKey && i.quantity > 0);

                if (!item) {
                    await interaction.followUp({ content: '❌ Ya no tienes ese objeto.', ephemeral: true });
                    return; // No consume turno si falla
                }

                // Definir efectos de items
                // TODO: Mover a una definición central de items
                if (itemKey === 'hierba_medicinal' || itemKey === 'health_potion') {
                    const healAmount = itemKey === 'health_potion' ? 50 : 30;
                    selfHeal = healAmount;
                    playerMsg = `🧪 Usaste **${item.item?.name || itemKey}** y recuperaste **${healAmount}** HP.`;
                } else if (itemKey === 'mana_potion') {
                    const manaAmount = 30;
                    mpRestore = manaAmount;
                    playerMsg = `💙 Usaste **${item.item?.name || itemKey}** y recuperaste **${manaAmount}** MP.`;
                } else {
                    playerMsg = `❓ Usaste **${item.item?.name || itemKey}** pero no tuvo efecto en combate.`;
                }

                // Consumir item
                await this.gameManager.playerDB.useItem(userId, itemKey, 1);

                // Aplicar efectos
                if (selfHeal > 0) {
                    battle.player.currentHp = Math.min(battle.player.stats.maxHp, battle.player.currentHp + selfHeal);
                }
                if (mpRestore > 0) {
                    battle.player.currentMp = Math.min(battle.player.stats.maxMp, battle.player.currentMp + mpRestore);
                }

            } else if (action === 'attack') {
                // ATAQUE BÁSICO
                const baseDmg = battle.player.stats.attack;
                const variance = Math.floor(Math.random() * 5);
                playerDamage = baseDmg + variance;
                
                // Crítico (10%)
                const isCrit = Math.random() < 0.1;
                if (isCrit) {
                    playerDamage *= 2;
                    playerMsg = `💥 **¡GOLPE CRÍTICO!** Atacas a ${battle.enemy.name} por **${playerDamage}** de daño.`;
                } else {
                    playerMsg = `⚔️ Atacas a ${battle.enemy.name} por **${playerDamage}** de daño.`;
                }
            } else if (action === 'skill' && skillKey) {
                // HABILIDAD
                const playerClass = battle.player.class?.toUpperCase();
                const skill = OFFICIAL_DATA.BASE_CLASSES[playerClass]?.abilities[skillKey];
                
                if (!skill) {
                    // Fallback si falla la skill
                    playerDamage = battle.player.stats.attack;
                    playerMsg = `❓ Usaste una habilidad desconocida. Atacas por **${playerDamage}**.`;
                } else {
                    // Coste de MP
                    battle.player.currentMp -= (skill.cost || 0);

                    // Calcular daño basado en fórmula (ej: "150% ATK")
                    let multiplier = 1.0;
                    if (typeof skill.damage === 'string' && skill.damage.includes('% ATK')) {
                        const pct = parseInt(skill.damage.split('%')[0]);
                        multiplier = pct / 100;
                    }
                    
                    // Calcular daño base de la skill
                    let skillDmg = Math.floor(battle.player.stats.attack * multiplier);
                    
                    // Crítico de skill
                    const isCrit = Math.random() < 0.15; // 15% base para skills
                    if (isCrit) {
                        // Si tiene daño crítico definido
                        if (skill.crit && skill.crit.includes('% ATK')) {
                            const critPct = parseInt(skill.crit.split('%')[0]);
                            skillDmg = Math.floor(battle.player.stats.attack * (critPct / 100));
                        } else {
                            skillDmg *= 2;
                        }
                        playerMsg = `✨ ${skill.emoji} **¡${skill.name} CRÍTICO!** Infliges **${skillDmg}** de daño.`;
                    } else {
                        playerMsg = `✨ ${skill.emoji} Usas **${skill.name}** e infliges **${skillDmg}** de daño.`;
                    }
                    
                    playerDamage = skillDmg;

                    // Efectos secundarios (Curación simple por ahora)
                    if (skill.effect && skill.effect.includes('Cura')) {
                        // "Cura 15% HP máx aliado" -> Curarse a sí mismo
                        if (skill.effect.includes('% HP')) {
                            const healPct = parseInt(skill.effect.match(/(\d+)%/)[1]);
                            selfHeal = Math.floor(battle.player.stats.maxHp * (healPct / 100));
                            battle.player.currentHp = Math.min(battle.player.stats.maxHp, battle.player.currentHp + selfHeal);
                            playerMsg += ` Recupeaste **${selfHeal}** HP.`;
                        }
                    }
                }
            }

            if (playerDamage > 0) {
                battle.enemy.currentHp -= playerDamage;
            }
            battle.log.push(playerMsg);

            // Verificar victoria
            if (battle.enemy.currentHp <= 0) {
                if (battle.onEnd) await battle.onEnd(interaction, 'victory');
                else await this.endBattle(interaction, battle, 'victory');
                return;
            }
        }

        // Turno Enemigo
        const enemyDmg = Math.max(1, battle.enemy.attack - (battle.player.stats.defense / 2));
        battle.player.currentHp -= enemyDmg;
        battle.log.push(`👾 ${battle.enemy.name} te ataca e inflige **${Math.floor(enemyDmg)}** de daño.`);

        // Verificar derrota
        if (battle.player.currentHp <= 0) {
            if (battle.onEnd) await battle.onEnd(interaction, 'defeat');
            else await this.endBattle(interaction, battle, 'defeat');
            return;
        }

        battle.turn++;
        
        // Limitar log
        if (battle.log.length > 5) battle.log = battle.log.slice(-5);

        // Obtener imagen de la habilidad si se usó una
        let actionImage = null;
        if (action === 'skill' && skillKey) {
            const playerClass = battle.player.class?.toUpperCase();
            const skill = OFFICIAL_DATA.BASE_CLASSES[playerClass]?.abilities[skillKey];
            if (skill && skill.image) {
                actionImage = skill.image;
            }
        }

        await this.updateBattleEmbed(interaction, battle, actionImage);
    }

    /**
     * Actualiza la interfaz de batalla
     */
    async updateBattleEmbed(interaction, battle, imageUrl = null) {
        // Helper para generar barras de progreso
        const createProgressBar = (current, max, type = 'hp') => {
            const percentage = Math.floor((current / max) * 10); // 0-10
            const empty = 10 - percentage;
            
            // Estilo de barras usando bloques
            const filledBlock = type === 'hp' ? '🟥' : '🟦';
            const emptyBlock = '⬛'; // Fondo negro para contraste
            
            const bar = filledBlock.repeat(percentage) + emptyBlock.repeat(empty);
            return `\`${bar}\` **${current}/${max}**`;
        };

        // --- EMBED 1: ENEMIGO ---
        // Obtener emoji de rareza desde RARITIES
        let rarityEmoji = '⚪';
        let rarityColor = '#b0b0b0'; // Default grey

        const rarityKey = (battle.enemy.rarity || 'Mundano').toLowerCase();
        if (RARITIES[rarityKey]) {
            rarityEmoji = RARITIES[rarityKey].emoji;
            rarityColor = RARITIES[rarityKey].color || rarityColor;
        } else {
            // Fallback si la key no coincide exactamente (ej: Title Case)
            const foundKey = Object.keys(RARITIES).find(k => k.toLowerCase() === rarityKey);
            if (foundKey) {
                rarityEmoji = RARITIES[foundKey].emoji;
                rarityColor = RARITIES[foundKey].color || rarityColor;
            }
        }

        const enemyEmbed = new EmbedBuilder()
            .setColor(rarityColor) 
            .setTitle(`${battle.enemy.emoji} **${battle.enemy.name}** ${rarityEmoji}`)
            .setThumbnail(battle.enemy.image || null) // Si tiene imagen
            .addFields(
                { name: '\u200b', value: `**Nivel:** \`${battle.enemy.level}\`\n**Rareza:** ${rarityEmoji} \`${battle.enemy.rarity || 'Mundano'}\`\n**Zona:** \`${battle.enemy.zoneName || 'Desconocida'}\``, inline: false },
                { name: '❤️ Vida', value: createProgressBar(battle.enemy.currentHp, battle.enemy.maxHp, 'hp'), inline: false }
            );

        // --- EMBED 2: REGISTRO DE BATALLA ---
        // Formatear log para resaltar nombres
        const formattedLog = battle.log.map(entry => {
            // Reemplazar nombres por formato código
            let text = entry;
            text = text.replace(battle.player.username, `\`${battle.player.username}\``);
            text = text.replace(battle.enemy.name, `\`${battle.enemy.name}\``);
            return text;
        }).join('\n');

        const logEmbed = new EmbedBuilder()
            .setColor(COLORS.NEUTRAL || '#5865F2') // Fallback color if COLORS.NEUTRAL is undefined
            .setTitle(`⚔️ Ronda ${battle.turn}`)
            .setDescription(formattedLog || '*El combate acaba de comenzar...*')
            .setFooter({ text: 'PassQuirk RPG • Sistema de Batalla' });
            
        // Añadir imagen de acción al log si existe (ej. skill usada)
        const files = [];
        if (imageUrl) {
            // Verificar si es una ruta local
            if (imageUrl.match(/^[a-zA-Z]:\\/)) {
                const filename = imageUrl.split('\\').pop();
                files.push({ attachment: imageUrl, name: filename });
                logEmbed.setImage(`attachment://${filename}`);
            } else {
                logEmbed.setImage(imageUrl);
            }
        }

        // --- EMBED 3: JUGADOR ---
        // Obtener datos de clase para mostrar bonito
        let playerClass = battle.player.class;
        
        // Normalizar para búsqueda en OFFICIAL_DATA
        // Las claves en OFFICIAL_DATA son como "CELESTIAL", "VOID", etc.
        // Si playerClass es objeto, usar .name o .id
        let classKey = typeof playerClass === 'string' ? playerClass : (playerClass?.name || playerClass?.id || 'Aventurero');
        
        // Intentar búsqueda flexible
        let classData = OFFICIAL_DATA.BASE_CLASSES[classKey]; // Exact match

        if (!classData) {
             const upperKey = classKey.toUpperCase();
             classData = OFFICIAL_DATA.BASE_CLASSES[upperKey]; // Upper match
             
             if (!classData) {
                 // Intentar normalizar espacios (OFFICIAL_DATA tiene espacios en algunas claves como "ALMA NACIENTE")
                 // Pero si la clave entrante tiene guiones bajos, probar reemplazar con espacios
                 const spaceKey = upperKey.replace(/_/g, ' ');
                 classData = OFFICIAL_DATA.BASE_CLASSES[spaceKey];

                 if (!classData) {
                     // Fallback inverso
                     const underscoreKey = upperKey.replace(/\s+/g, '_');
                     classData = OFFICIAL_DATA.BASE_CLASSES[underscoreKey];
                 }
             }
        }
        
        // Formatear nombre para mostrar (Title Case)
        // Si encontramos classData, usamos su nombre oficial. Si no, formateamos la key.
        let className = classData ? classData.name : classKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const classEmoji = classData ? classData.emoji : '👤';

        // Barra de XP
        // Usar LevelSystem si está disponible para cálculo real
        const levelSystem = this.gameManager.systems.level;
        const currentXp = battle.player.xp || 0;
        // Asegurar nextXp válido > 0
        const nextXp = levelSystem ? levelSystem.calculateXpForNextLevel(battle.player.level) : 100;
        
        // Calcular porcentaje seguro (evitar NaN)
        const xpPercent = nextXp > 0 ? Math.floor((currentXp / nextXp) * 100) : 0;
        
        // Generar barra visual
        // Si usamos createProgressBar local, aseguramos que nextXp sea válido
        const xpBar = createProgressBar(currentXp, Math.max(1, nextXp), 'xp').split(' ')[0];

        const playerEmbed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY || '#0099ff')
            .setAuthor({ name: `Combate de ${battle.player.username}`, iconURL: battle.player.avatarURL || undefined })
            .setThumbnail(battle.player.avatarURL || null)
            .addFields(
                { name: '❤️ Salud', value: createProgressBar(battle.player.currentHp, battle.player.stats.maxHp, 'hp'), inline: false },
                { name: '💧 Energía', value: createProgressBar(battle.player.currentMp, battle.player.stats.maxMp, 'mp'), inline: false },
                { name: '📊 Progreso', value: `**Nivel:** \`${battle.player.level}\`\n${xpBar} ${xpPercent}%`, inline: true },
                { name: '👤 Clase', value: `${classEmoji} **${className}**`, inline: true }
            );

        const row = new ActionRowBuilder();
        
        // Botón de Atacar siempre presente
        row.addComponents(
            new ButtonBuilder().setCustomId('combat_attack').setLabel('Atacar').setStyle(ButtonStyle.Danger).setEmoji('⚔️')
        );

        // Botones de Habilidades (Dinámicos según desbloqueo)
        if (classData && classData.abilities) {
            const playerLevel = parseInt(battle.player.level) || 1;

            // Habilidad Básica (Generalmente Nivel 5+)
            if (classData.abilities.basic) {
                const unlockLevel = parseInt(classData.abilities.basic.unlockLevel) || 5; // Default 5 si no está definido explícitamente
                if (playerLevel >= unlockLevel) {
                    const skill = classData.abilities.basic;
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId('combat_skill_basic')
                            .setLabel(`${skill.name} (${skill.cost} MP)`)
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji(skill.emoji || '✨')
                            .setDisabled(battle.player.currentMp < skill.cost) // Deshabilitar si no hay MP
                    );
                }
            }
            
            // Habilidad Poder (Generalmente Nivel 10+)
            if (classData.abilities.power) {
                const unlockLevel = parseInt(classData.abilities.power.unlockLevel) || 10;
                if (playerLevel >= unlockLevel) {
                    const skill = classData.abilities.power;
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId('combat_skill_power')
                            .setLabel(`${skill.name} (${skill.cost} MP)`)
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji(skill.emoji || '🔥')
                            .setDisabled(battle.player.currentMp < skill.cost)
                    );
                }
            }
            
            // Habilidad Especial (Generalmente Nivel 15+)
            if (classData.abilities.special) {
                const unlockLevel = parseInt(classData.abilities.special.unlockLevel) || 15;
                if (playerLevel >= unlockLevel) {
                    const skill = classData.abilities.special;
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId('combat_skill_special')
                            .setLabel(`${skill.name} (${skill.cost} MP)`)
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji(skill.emoji || '🌟')
                            .setDisabled(battle.player.currentMp < skill.cost)
                    );
                }
            }
        } else {
            // Fallback botón genérico si no hay datos de clase (legacy)
            row.addComponents(
                new ButtonBuilder().setCustomId('combat_skill').setLabel('Habilidades').setStyle(ButtonStyle.Primary).setEmoji('✨')
            );
        }

        // Botones estándar restantes
        row.addComponents(
            new ButtonBuilder().setCustomId('combat_inventory').setLabel('Inventario').setStyle(ButtonStyle.Secondary).setEmoji('🎒'),
            new ButtonBuilder().setCustomId('combat_flee').setLabel(`Huir (${battle.fleeAttempts}/3)`).setStyle(ButtonStyle.Secondary).setEmoji('🏃')
        );

        const payload = { embeds: [enemyEmbed, logEmbed, playerEmbed], components: [row], files: files };

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply(payload);
        } else {
            await interaction.reply(payload);
        }
    }

    /**
     * Finaliza el combate
     */
    async endBattle(interaction, battle, result) {
        this.activeBattles.delete(battle.player.userId);
        
        // Referencia al sistema de exploración para volver
        const explorationSystem = this.gameManager.systems.exploration;
        const exploration = explorationSystem.activeExplorations.get(battle.player.userId);
        
        // PERSISTIR ESTADO (Vida/Mana)
        // Importante: Si se huye, la vida actual se debe guardar para la siguiente batalla
        if (exploration) {
            exploration.player.currentHp = battle.player.currentHp;
            exploration.player.currentMp = battle.player.currentMp;
            exploration.player.stats.hp = battle.player.currentHp; // Sincronizar
            exploration.player.stats.mp = battle.player.currentMp;
            
            // Guardar en DB inmediatamente
            await this.gameManager.playerDB.savePlayer(exploration.player);
        }

        if (result === 'victory') {
            // Calcular recompensas (Base + Nivel)
            // NOTA: ExplorationSystem suele manejar esto mejor si viene de un evento, 
            // pero aquí ponemos un fallback por si se inicia combate directo.
            // Si viene de exploración, el callback `onEnd` en ExplorationSystem debería manejarlo y NO entrar aquí.
            // Si `battle.onEnd` estaba definido, startBattle lo llamó y retornó antes.
            // Así que esto es solo para combates "huerfanos" o debug.
            
            const xp = battle.enemy.level * 10; // Fallback si no viene de evento
            const coins = battle.enemy.level * 5;

            // Recuperar drop si es posible (via exploration system helper si existiera, o simple)
            // ...
            
            await this.gameManager.playerDB.addExperience(interaction, battle.player.userId, xp);
            
            // Recargar jugador actualizado desde DB para evitar sobrescribir XP con datos antiguos de batalla
            const updatedPlayer = await this.gameManager.playerDB.getPlayer(battle.player.userId);
            updatedPlayer.gold = (updatedPlayer.gold || 0) + coins;
            
            // Guardar cambios finales (Gold actualizado, XP ya se guardó en addExperience)
            await this.gameManager.playerDB.savePlayer(updatedPlayer);

            // LOG COMBAT
            await this.gameManager.playerDB.logCombat(
                battle.player.userId,
                battle.enemy,
                'victory',
                { xp, coins },
                battle.enemy.zoneName || 'unknown',
                battle.turn
            );

            const embed = new OfficialEmbedBuilder()
                .setOfficialStyle('success')
                .setOfficialTitle('VICTORIA', '🏆')
                .setOfficialDescription(`Has derrotado a **${battle.enemy.name}**.\n\n**Recompensas:**\n✨ \`+${xp}\` EXP\n${EMOJIS.GOLD} \`+${coins}\` PassCoins`);
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`explore_continue_${exploration.id}`).setLabel('Continuar').setStyle(ButtonStyle.Success).setEmoji('🗺️')
                );
            
            if (exploration) exploration.status = 'exploring';
            await interaction.editReply({ embeds: [embed.getEmbed()], components: [row] });

        } else if (result === 'fled') {
            // Huida
            await this.gameManager.playerDB.logCombat(
                battle.player.userId,
                battle.enemy,
                'fled',
                {},
                battle.enemy.zoneName || 'unknown',
                battle.turn
            );

            const embed = new OfficialEmbedBuilder()
                .setOfficialStyle('combat')
                .setOfficialTitle('ESCAPASTE', '💨')
                .setOfficialDescription(`Has logrado huir de **${battle.enemy.name}**.`);
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`explore_continue_${exploration.id}`).setLabel('Continuar').setStyle(ButtonStyle.Secondary).setEmoji('🗺️')
                );

            if (exploration) exploration.status = 'exploring';
            await interaction.editReply({ embeds: [embed.getEmbed()], components: [row] });

        } else {
            // Derrota
            // Resetear vida a un mínimo o dejar muerto (por ahora dejar a 0 para lógica de revivir o reset)
            // ...
            
            // LOG COMBAT
            await this.gameManager.playerDB.logCombat(
                battle.player.userId,
                battle.enemy,
                'defeat',
                {},
                battle.enemy.zoneName || 'unknown',
                battle.turn
            );

            const embed = new OfficialEmbedBuilder()
                .setOfficialStyle('combat') // O error/danger si existiera estilo específico
                .setOfficialTitle('DERROTADO', '💀')
                .setOfficialDescription(`Has sido derrotado por **${battle.enemy.name}**.`);
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`explore_cancel_${exploration.id}`).setLabel('Salir').setStyle(ButtonStyle.Danger).setEmoji('🏠')
                );
                
            if (exploration) exploration.status = 'completed';
            await interaction.editReply({ embeds: [embed.getEmbed()], components: [row] });
        }
    }
}

module.exports = CombatSystem;
