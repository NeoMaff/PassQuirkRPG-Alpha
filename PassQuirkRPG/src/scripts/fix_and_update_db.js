require('dotenv').config({ path: 'e:/PassQuirk/PassQuirkRPG/.env' });
const { createClient } = require('@supabase/supabase-js');
const { BASE_CLASSES, RACES, ENEMIES_BY_ZONE } = require('../data/passquirk-official-data');
const RARITIES = require('../data/rarities');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
    console.log('🔄 Iniciando actualización de base de datos...');

    // 0. Actualizar Rarezas
    console.log('\n💎 Actualizando Rarezas...');
    
    const RANK_MAP = {
        'Mundano': 1,
        'Refinado': 2,
        'Sublime': 3,
        'Supremo': 4,
        'Trascendente': 5,
        'Celestial': 6,
        'Dragón': 7,
        'Caos': 8,
        'Cósmico': 9
    };

    for (const [key, data] of Object.entries(RARITIES)) {
        // Extract ID if present
        const emojiId = data.emoji.includes(':') ? data.emoji.split(':')[2].replace('>', '') : null;
        
        const payload = {
            name: data.name, // Name is unique key usually
            emoji: data.emoji,
            // emoji_id: emojiId,
            color: data.color,
            multiplier: data.multiplier,
            rank: RANK_MAP[data.name] || 99 // Default rank if not found
        };
        
        // Try to update rarities (official table name per supabase.md)
        const { error } = await supabase
            .from('rarities')
            .upsert(payload, { onConflict: 'name' });

        if (error) {
            console.error(`❌ Error actualizando rareza ${data.name}:`, error.message);
        } else {
            console.log(`✅ Rareza ${data.name} actualizada correctamente.`);
        }
    }
    

    // 0.5. Actualizar Zonas (NUEVO)
    console.log('\n🗺️ Actualizando Zonas...');
    for (const [key, data] of Object.entries(ENEMIES_BY_ZONE)) {
        // Zone key should be lowercase
        const zoneKey = key.toLowerCase();
        
        // Determine min_level and max_level from string range
        // Examples: "1-10", "80+", "90-100+"
        let minLevel = 1;
        let maxLevel = 99999; // Default to practically infinite
        
        if (data.level_range) {
            const parts = data.level_range.split('-');
            if (parts.length > 0) {
                minLevel = parseInt(parts[0].replace('+', '')) || 1;
            }
            // Ignore max level from string to ensure no cap
        }

        const payload = {
            key: zoneKey,
            name: data.name,
            description: `Zona de nivel ${minLevel}+.`, // Updated description
            min_level: minLevel,
            max_level: maxLevel,
            // emoji: data.emoji, // Column missing
            // is_active: true // Column missing
        };

        const { error } = await supabase
            .from('zones')
            .upsert(payload, { onConflict: 'key' });

        if (error) {
            console.error(`❌ Error actualizando zona ${zoneKey}:`, error.message);
        } else {
            console.log(`✅ Zona ${zoneKey} actualizada correctamente.`);
        }
    }

    // 1. Actualizar Clases
    console.log('\n📦 Actualizando Clases...');
    for (const [key, data] of Object.entries(BASE_CLASSES)) {
        const id = key.toLowerCase();
        const emojiId = data.emoji.includes(':') ? data.emoji.split(':')[2].replace('>', '') : null;
        
        const payload = {
            key: id,
            name: key.charAt(0) + key.slice(1).toLowerCase(), // Capitalize
            description: data.description,
            role: data.role,
            style: data.style,
            emoji: data.emoji, // Full emoji string
            // emoji_id: emojiId, // Column missing
            image: data.image, // Try 'image' instead of 'image_url' if previous failed, or keep if not sure. 
            // Let's try to map to standard columns. If DB has 'image', use it.
            base_stats: data.baseStats,
            abilities: data.abilities
        };

        // Intentar actualizar en 'classes'
        const { error } = await supabase
            .from('classes')
            .upsert(payload, { onConflict: 'key' });

        if (error) {
            console.error(`❌ Error actualizando clase ${id}:`, error.message);
        } else {
            console.log(`✅ Clase ${id} actualizada correctamente.`);
        }
    }

    // 2. Actualizar Razas
    console.log('\n🧬 Actualizando Razas...');
    for (const [key, data] of Object.entries(RACES)) {
        const id = key.toLowerCase();
        const emojiId = data.emoji.includes(':') ? data.emoji.split(':')[2].replace('>', '') : null;
        
        const payload = {
            key: id.toUpperCase(), // Races use uppercase keys in data
            name: data.name,
            description: data.description,
            emoji: data.emoji,
            // emoji_id: emojiId,
            image: data.image,
            bonuses: data.bonuses,
            multipliers: data.multipliers
        };

        const { error } = await supabase
            .from('races')
            .upsert(payload, { onConflict: 'key' });

        if (error) {
            console.error(`❌ Error actualizando raza ${id}:`, error.message);
        } else {
            console.log(`✅ Raza ${id} actualizada correctamente.`);
        }
    }

    // 3. Intentar arreglar schema de combats
    console.log('\n⚔️ Verificando tabla combats y SQL necesarios...');
    console.log('⚠️ Para corregir los errores de zonas y combate, ejecuta este SQL en Supabase:');
    console.log(`
-- Permitir inserción en zonas (RLS)
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for service role" ON zones FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for service role" ON zones FOR UPDATE USING (true);

-- Añadir columnas faltantes en Zonas
ALTER TABLE zones ADD COLUMN IF NOT EXISTS emoji TEXT;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS min_level INTEGER DEFAULT 1;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS max_level INTEGER DEFAULT 999;

-- Añadir columna faltante en Combates
ALTER TABLE combats ADD COLUMN IF NOT EXISTS enemy_level INTEGER DEFAULT 1;
    `);

    // 4. Limpieza de jugadores con clases inválidas
    console.log('\n🧹 Limpiando jugadores con clases inválidas...');
    const { data: players, error: pError } = await supabase
        .from('players')
        .select('user_id, class, json_data');
    
    if (players) {
        for (const p of players) {
            let needsUpdate = false;
            let newClass = p.class;
            let newJson = p.json_data;

            // Verificar si class es un objeto stringificado o 'undefined'
            if (typeof p.class === 'string' && (p.class === 'undefined' || p.class.includes('{'))) {
                newClass = null;
                needsUpdate = true;
            }
            
            // Verificar json_data.class
            if (p.json_data && p.json_data.class && typeof p.json_data.class === 'object') {
                // Normalizar a string key
                if (p.json_data.class.key) {
                    newJson.class = p.json_data.class.key.toLowerCase();
                    if (!newClass) newClass = newJson.class;
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                console.log(`🛠️ Corrigiendo jugador ${p.user_id}...`);
                await supabase.from('players').update({
                    class: newClass,
                    json_data: newJson
                }).eq('user_id', p.user_id);
            }
        }
    }

    console.log('\n✅ Proceso finalizado.');
}

run();
