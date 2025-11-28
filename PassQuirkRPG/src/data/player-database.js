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

        const oldLevel = player.level;
        player.experience += amount;

        // Calcular nuevo nivel
        // Fórmula simple: 100 * (nivel ^ 1.5)
        let levelsGained = 0;
        while (player.experience >= player.nextLevelExp) {
            player.experience -= player.nextLevelExp;
            player.level++;
            player.nextLevelExp = Math.floor(100 * Math.pow(1.5, player.level - 1));
            levelsGained++;
            
            // Mejorar stats al subir nivel (simple +10%)
            player.stats.hp = Math.floor(player.stats.hp * 1.1);
            player.stats.maxHp = Math.floor(player.stats.maxHp * 1.1);
            player.stats.attack = Math.floor(player.stats.attack * 1.1);
        }

        if (levelsGained > 0) {
            // Notificar subida de nivel
            if (interaction && interaction.channel) {
                const { EmbedBuilder } = require('discord.js');
                const levelUpEmbed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('🎉 ¡SUBIDA DE NIVEL!')
                    .setDescription(`¡Felicidades **${player.username}**! Has alcanzado el **Nivel ${player.level}**.\n\nTus estadísticas han aumentado.`)
                    .setFooter({ text: 'Sigue explorando para desbloquear más poder.' });
                
                // Usar followUp si es posible para no romper flujo
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [levelUpEmbed], ephemeral: true });
                } else {
                    // Si no, intentar enviar al canal (cuidado con permisos)
                    // await interaction.channel.send({ content: `<@${userId}>`, embeds: [levelUpEmbed] });
                }
            }

            // Chequear desbloqueos (Notificaciones)
            try {
                const NotificationSystem = require('../systems/notification-system');
                const notifier = new NotificationSystem(interaction.client); // Necesitamos client
                await notifier.checkUnlocks(interaction, player, oldLevel, player.level);
            } catch (err) {
                console.error('Error en sistema de notificaciones:', err);
            }
        }

        await this.savePlayer(player);
        return levelsGained > 0;
    }

    // Guardar jugador (Async)
    async savePlayer(player) {
        this.players[player.userId] = player;

        try {
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
                    // Columnas relacionales/visibles para el Dashboard
                    level: cleanPlayer.level || 1,
                    class: null,
                    race: null,
                    current_zone: null,
                    gold: cleanPlayer.inventory ? cleanPlayer.inventory.gold : 0,
                    updated_at: new Date().toISOString() // Forzar update
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
            .select('item_key, quantity, equipped_slot')
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
