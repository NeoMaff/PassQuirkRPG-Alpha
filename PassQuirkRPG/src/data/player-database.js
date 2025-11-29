const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase Client Initialized');
} else {
    console.warn('⚠️ Supabase credentials missing. Falling back to local memory storage.');
}

// Estructura por defecto del jugador (Schema JSON)
const DEFAULT_PLAYER = {
    userId: '',
    username: '',
    profileIcon: null, // URL del icono personalizado
    gender: 'undetermined', // 'male', 'female'
    race: null,   // { id, name, bonuses }
    class: null,  // { id, name, stats }
    level: 1,
    experience: 0,
    nextLevelExp: 100,
    stats: {
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        attack: 10,
        defense: 5,
        speed: 10,
        magic: 0
    },
    inventory: {
        gold: 0,
        items: [], // [{ id, name, type, quantity, ... }]
        equipment: {
            weapon: null,
            armor: null,
            accessory: null
        }
    },
    quirk: null, // { id, name, description, power, ... }
    location: 'tutorial', // 'space_central', 'bosque_inicial', 'reino_akai', etc.
    state: 'idle', // 'idle', 'fighting', 'exploring', 'shopping'
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    // Flags de progreso
    tutorialCompleted: false,
    mission: null // { id, status, progress }
};

class PlayerDatabase {
    constructor() {
        this.players = {};
        this.saveInterval = null;
    }

    loadLocalBackup() {}
    saveLocalBackup() {}
    loadLocalTutorialState() {}

    // Obtener jugador (con caché y DB)
    async getPlayer(userId) {
        if (this.players[userId]) {
            return this.players[userId];
        }

        try {
            // Verificar si Supabase está configurado correctamente
            if (!supabaseUrl || !supabaseKey) {
                console.warn('Supabase no configurado. Usando caché en memoria sin persistencia local.');
                return this.players[userId] || null;
            }

            const { data, error } = await supabase
                .from('players')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                if (error.code !== 'PGRST116') { // PGRST116: No rows found
                    console.error('Error fetching player from Supabase:', error.message);
                }
                // Fallback a memoria local si falla la consulta a Supabase (salvo que sea 'No rows found' real)
                // Pero PGRST116 significa que no existe, así que retornamos cache por si acaso (si se guardó local pero no remoto)
                return this.players[userId] || null;
            }

            if (data) {
                // Combinar datos por si añadimos nuevos campos a DEFAULT_PLAYER
                const player = { ...DEFAULT_PLAYER, ...data.json_data, userId: data.user_id, username: data.username };

                // Mapear columnas canónicas → objeto en memoria
                if (data.level !== undefined) player.level = data.level;
                if (data.class) player.class = data.class;
                if (data.race) player.race = data.race;
                if (data.current_zone) {
                    player.currentZone = data.current_zone;
                    player.location = data.current_zone;
                }
                if (data.stats_json && Object.keys(data.stats_json).length) {
                    player.stats = { ...player.stats, ...data.stats_json };
                }
                // Economía unificada
                if (!player.inventory) player.inventory = { gold: 0, items: [], equipment: { weapon: null, armor: null, accessory: null } };
                if (data.gold !== undefined) {
                    player.inventory.gold = data.gold;
                    player.gold = data.gold;
                }
                // Quirk: garantizar valor visible
                if (!player.quirk) player.quirk = 'Ninguno';

                this.players[userId] = player;
                return player;
            }
        } catch (err) {
            console.error('Exception fetching player (Supabase unavailable?):', err.message);
            // Fallback silencioso a memoria local si la API falla (ej: fetch failed)
            return this.players[userId] || null;
        }

        return null;
    }

    // Crear nuevo jugador
    async createPlayer(user) {
        const newPlayer = {
            ...DEFAULT_PLAYER,
            userId: user.id,
            username: user.username,
            createdAt: new Date().toISOString()
        };

        this.players[user.id] = newPlayer;
        await this.savePlayer(newPlayer);
        return newPlayer;
    }

    /**
     * Añade experiencia y maneja subida de nivel
     */
    async addExperience(interaction, userId, amount) {
        const player = await this.getPlayer(userId);
        if (!player) return false;

        // Usar la propiedad 'xp' (canónica) en lugar de 'experience' para evitar conflictos
        player.xp = (player.xp || player.experience || 0) + amount;
        player.experience = player.xp; // Sync legacy field

        // Delegar lógica de nivel al sistema de nivel si está disponible en el cliente
        // Acceder a través de interaction.client o global si es necesario
        let levelSystem = null;
        if (interaction && interaction.client && interaction.client.gameManager && interaction.client.gameManager.systems) {
            levelSystem = interaction.client.gameManager.systems.level;
        }

        if (levelSystem) {
            await levelSystem.checkLevelUp(player, interaction);
        } else {
            // Fallback básico si no hay sistema cargado (para pruebas unitarias o scripts)
            await this.savePlayer(player);
        }
        
        return true;
    }

    // Guardar jugador (Async)
    /**
     * Mapea nombres de zona a claves de DB válidas
     */
    mapZoneToKey(zoneName) {
        if (!zoneName) return 'space_central'; // Default seguro
        
        const normalized = zoneName.toLowerCase().trim();
        
        if (normalized.includes('mayoi') || normalized.includes('bosque')) return 'bosque_inicial';
        if (normalized.includes('space') || normalized.includes('central')) return 'space_central';
        if (normalized.includes('tutorial')) return 'space_central'; // Tutorial -> Space Central
        
        // Si ya es una clave válida (snake_case), devolverla
        if (normalized.match(/^[a-z0-9_]+$/)) return normalized;
        
        return 'space_central'; // Fallback
    }

    async savePlayer(player) {
        this.players[player.userId] = player;

        try {
            // Sincronizar gold antes de guardar
            // Prioridad: inventory.gold (memoria activa) -> player.gold (root)
            if (player.inventory && player.inventory.gold !== undefined) {
                player.gold = player.inventory.gold;
            }

            // Verificar si Supabase está configurado
            if (!supabaseUrl || !supabaseKey) {
                return true; // Guardado "exitoso" en memoria
            }

            // Asegurar que el objeto es serializable y limpio
            const cleanPlayer = JSON.parse(JSON.stringify(player));

            // Guardar en Supabase
            const { error } = await supabase
                .from('players')
                .upsert({ 
                    user_id: cleanPlayer.userId,
                    username: cleanPlayer.username,
                    json_data: cleanPlayer,
                    class: (() => {
                        const c = cleanPlayer.class;
                        if (!c || c === 'undefined') return null;
                        const key = typeof c === 'string' ? c : (c.id || c.key || c.name);
                        return key ? key.toLowerCase() : null;
                    })(), // Class keys are lowercase in DB
                    level: cleanPlayer.level || 1,
                    experience: cleanPlayer.xp || cleanPlayer.experience || 0, // Default 0 to avoid undefined
                    race: (typeof cleanPlayer.race === 'string' ? cleanPlayer.race : (cleanPlayer.race?.id || cleanPlayer.race?.key || cleanPlayer.race?.name || null))?.toUpperCase(), // Race keys are UPPERCASE in DB (HUMANOS, etc)
                    current_zone: this.mapZoneToKey(cleanPlayer.currentZone || cleanPlayer.location), 
                    gold: cleanPlayer.inventory ? cleanPlayer.inventory.gold : 0,
                    stats_json: cleanPlayer.stats || {},
                    mission_id: cleanPlayer.mission?.id || null,
                    mission_status: cleanPlayer.mission?.status || null,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) {
                console.error('Error saving player to Supabase:', error.message);
                // No lanzar error para no romper el flujo del juego si la DB falla
            }
        } catch (err) {
            console.error('Exception saving player (Supabase unavailable?):', err.message);
        }
        
        return true;
    }

    // Eliminar jugador (Async)
    async deletePlayer(userId) {
        delete this.players[userId];

        try {
            // Verificar si Supabase está configurado
            if (!supabaseUrl || !supabaseKey) {
                return; // Eliminado solo de memoria
            }

            const { error } = await supabase
                .from('players')
                .delete()
                .eq('user_id', userId);

            if (error) {
                console.error('Error deleting player from Supabase:', error.message);
                // No lanzar error
            } else {
                console.log(`Player ${userId} deleted successfully.`);
            }
        } catch (err) {
            console.error('Exception deleting player (Supabase unavailable?):', err.message);
            // No lanzar error
        }
    }

    async uploadUserAvatar(userId, fileBuffer, filename, mimeType = 'image/png') {
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase no configurado');
        }
        const pathKey = `avatars/${userId}/${Date.now()}_${filename}`;
        const { error: upErr } = await supabase.storage.from('images').upload(pathKey, fileBuffer, { contentType: mimeType, upsert: true });
        if (upErr) throw new Error(upErr.message);
        const { data } = supabase.storage.from('images').getPublicUrl(pathKey);
        const player = await this.getPlayer(userId);
        if (!player) throw new Error('Jugador no encontrado');
        player.avatar_url = data.publicUrl;
        await this.savePlayer(player);
        return data.publicUrl;
    }

    /**
     * Obtiene el inventario del jugador desde la tabla relacional player_items
     */
    async getInventory(userId) {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('player_items')
            .select('item_key, quantity, equipped_slot, item:items!inner(key,name,category,rarity_id)')
            .eq('user_id', userId);
        
        if (error) {
            console.error('Error fetching inventory:', error);
            return [];
        }
        return data || [];
    }

    /**
     * Añade un item al inventario (upsert en player_items)
     */
    async addItem(userId, itemKey, quantity = 1) {
        if (!supabase) return false;
        
        // Obtener cantidad actual (si existe)
        const { data: current } = await supabase
            .from('player_items')
            .select('quantity')
            .eq('user_id', userId)
            .eq('item_key', itemKey)
            .single();
            
        const newQuantity = (current?.quantity || 0) + quantity;
        
        const { error } = await supabase
            .from('player_items')
            .upsert({ user_id: userId, item_key: itemKey, quantity: newQuantity });
            
        if (error) {
            console.error('Error adding item:', error);
            return false;
        }
        return true;
    }

    /**
     * Usa (consume) un item del inventario
     */
    async useItem(userId, itemKey, quantity = 1) {
        if (!supabase) return false;
        
        const { data: current } = await supabase
            .from('player_items')
            .select('quantity')
            .eq('user_id', userId)
            .eq('item_key', itemKey)
            .single();
            
        if (!current || current.quantity < quantity) return false;
        
        const newQuantity = current.quantity - quantity;
        
        if (newQuantity <= 0) {
            // Eliminar si llega a 0
            const { error } = await supabase.from('player_items').delete().eq('user_id', userId).eq('item_key', itemKey);
            return !error;
        } else {
            const { error } = await supabase
                .from('player_items')
                .update({ quantity: newQuantity })
                .eq('user_id', userId)
                .eq('item_key', itemKey);
            return !error;
        }
    }

    /**
     * Equipa un item (actualiza equipped_slot)
     */
    async equipItem(userId, itemKey, slot) {
        if (!supabase) return false;
        
        // Primero desequipar cualquier cosa en ese slot
        await supabase
            .from('player_items')
            .update({ equipped_slot: null })
            .eq('user_id', userId)
            .eq('equipped_slot', slot);
            
        // Equipar el nuevo
        const { error } = await supabase
            .from('player_items')
            .update({ equipped_slot: slot })
            .eq('user_id', userId)
            .eq('item_key', itemKey);
            
        return !error;
    }

    /**
     * Obtiene el inventario del jugador
     */
    async getInventory(userId) {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('player_items')
            .select('*, item:items(*)') // Join con tabla items para detalles
            .eq('user_id', userId);

        if (error) {
            console.error('Error getting inventory:', error);
            return [];
        }
        return data;
    }

    /**
     * Crea una nueva sesión de exploración
     */
    async createExplorationSession(userId, zoneId, mode = 'manual') {
        if (!supabase) return null;
        
        const { data, error } = await supabase
            .from('explorations')
            .insert({
                user_id: userId,
                zone_key: zoneId,
                status: 'active',
                distance_covered: 0,
                distance_total: 0,
                counters_json: {
                    events_log: [{ type: 'start', mode, timestamp: new Date().toISOString() }],
                    rewards: { coins: 0, items: [], xp: 0 }
                }
            })
            .select()
            .single();
            
        if (error) {
            console.error('Error creating exploration session:', error);
            return null;
        }
        return data;
    }

    /**
     * Obtiene la sesión de exploración activa de un usuario
     */
    async getActiveExplorationSession(userId) {
        if (!supabase) return null;
        
        const { data, error } = await supabase
            .from('explorations')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();
            
        if (error) {
            if (error.code !== 'PGRST116') console.error('Error fetching active exploration:', error);
            return null;
        }
        return data;
    }

    /**
     * Actualiza una sesión de exploración
     */
    async updateExplorationSession(sessionId, updates) {
        if (!supabase) return false;
        
        // Mapear nombres de campos si es necesario
        const dbUpdates = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.distance_covered !== undefined) dbUpdates.distance_covered = updates.distance_covered;
        if (updates.distance_total !== undefined) dbUpdates.distance_total = updates.distance_total;
        if (updates.counters_json) dbUpdates.counters_json = updates.counters_json;
        if (updates.last_event_json) dbUpdates.last_event_json = updates.last_event_json;

        // Si updates contiene campos crudos que coinciden, usarlos
        Object.assign(dbUpdates, updates);

        const { error } = await supabase
            .from('explorations')
            .update(dbUpdates)
            .eq('id', sessionId);
            
        if (error) {
            console.error('Error updating exploration session:', error);
            return false;
        }
        return true;
    }

    /**
     * Añade experiencia al jugador y gestiona la subida de nivel
     */
    async addExperience(interaction, userId, amount) {
        const player = await this.getPlayer(userId);
        if (!player) return false;

        player.xp = (player.xp || 0) + amount;
        
        // Intentar usar LevelSystem para verificar Level Up
        // Accedemos via interaction.client.gameManager
        if (interaction && interaction.client && interaction.client.gameManager) {
             const levelSystem = interaction.client.gameManager.systems.level;
             if (levelSystem) {
                 await levelSystem.checkLevelUp(player, interaction);
             }
        } else {
            // Fallback básico si no hay sistema de nivel accesible (solo guardar XP)
            // Opcional: Implementar lógica simple de nivel aquí si es crítico
        }

        await this.savePlayer(player);
        return true;
    }

    /**
     * Registra una transacción de PassCoins
     */
    async addWalletTransaction(userId, amount, direction, source, metadata = {}) {
        if (!supabase) return false;

        const { error } = await supabase
            .from('wallet_transactions')
            .insert({
                user_id: userId,
                amount: amount,
                direction: direction, // 'earn', 'spend', 'transfer_in', 'transfer_out'
                source: source,
                metadata: metadata
            });

        if (error) {
            console.error('Error adding wallet transaction:', error);
            return false;
        }
        // Actualizar saldo canónico en players.gold
        const player = await this.getPlayer(userId);
        if (player) {
            const delta = ['earn', 'transfer_in'].includes(direction) ? amount : -amount;
            player.inventory = player.inventory || { gold: 0 };
            player.inventory.gold = Math.max(0, (player.inventory.gold || 0) + delta);
            player.gold = player.inventory.gold;
            await this.savePlayer(player);
        }
        return true;
    }

    /**
     * Registra un evento del PassSystem (Minería/Pesca) en DB
     */
    async logPassystemEvent(userId, type, zoneKey, rarity, dropItemKey, amount, passcoins) {
        if (!supabase) return false;

        // Validar inputs contra constraints de DB
        const validTypes = ['mining', 'fishing'];
        if (!validTypes.includes(type)) {
            console.warn(`Intento de loggear tipo inválido en passystem_events: ${type}`);
            return false;
        }

        // Asegurar capitalización correcta para rareza (DB check constraint: 'Mundano', 'Refinado'...)
        // Si viene 'mundano', convertir a 'Mundano'
        const formattedRarity = rarity.charAt(0).toUpperCase() + rarity.slice(1).toLowerCase();

        const { error } = await supabase
            .from('passystem_events')
            .insert({
                user_id: userId,
                type: type,
                zone_key: zoneKey,
                rarity: formattedRarity,
                drop_item_key: dropItemKey,
                amount: amount,
                passcoins: passcoins
            });

        if (error) {
            console.error('Error logging passystem event:', error);
            return false;
        }
        return true;
    }

    /**
     * Registra un resultado de combate en la tabla 'combats'
     */
    async logCombat(userId, enemy, result, rewards = {}, zoneKey = 'unknown', rounds = 0) {
        if (!supabase) return false;

        const { error } = await supabase
            .from('combats')
            .insert({
                user_id: userId,
                // enemy_name: enemy.name, // TODO: Uncomment after running SQL migration
                // enemy_level: enemy.level,
                // enemy_rarity: enemy.rarity,
                result: result, // 'victory', 'defeat', 'fled'
                rounds: rounds,
                zone_key: zoneKey,
                // xp_earned: rewards.xp || 0,
                // gold_earned: rewards.coins || 0,
                // items_earned_json: rewards.items || [],
                timestamp: new Date().toISOString()
            });

        if (error) {
            console.error('Error logging combat:', error);
            // No retornar false para no romper flujo, solo loggear
            return false;
        }
        return true;
    }

    // Iniciar autoguardado (opcional)
    startAutoSave(intervalMs = 300000) { // 5 minutos
        if (this.saveInterval) clearInterval(this.saveInterval);
        this.saveInterval = setInterval(async () => {
            console.log('🔄 Auto-saving players...');
            const promises = Object.values(this.players).map(p => this.savePlayer(p));
            await Promise.all(promises);
            console.log('✅ Auto-save complete.');
        }, intervalMs);
    }
}

module.exports = new PlayerDatabase();
