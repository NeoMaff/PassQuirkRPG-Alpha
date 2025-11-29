require('dotenv').config({ path: 'e:/PassQuirk/PassQuirkRPG/.env' });
const { createClient } = require('@supabase/supabase-js');
const { ENEMIES_BY_ZONE } = require('../src/data/passquirk-official-data');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function fixSupabase() {
    console.log('🔧 Starting Supabase Fix...');

    // 1. Insert Zones
    console.log('\n🌍 Inserting Zones...');
    
    // Prepare zones data
    // Column names from debug: key, name, description, difficulty, distance, image_url, emoji, is_active, min_level, max_level
    const zones = [
        {
            key: 'space_central',
            name: 'Space Central',
            emoji: '🌌',
            min_level: 1,
            description: 'El centro del universo PassQuirk',
            difficulty: 'Tutorial',
            is_active: true
        },
        // Add all zones from official data
        ...Object.entries(ENEMIES_BY_ZONE).map(([key, data]) => {
            const levelRange = (data.level_range || '1-100').split('-');
            const minLevel = parseInt(levelRange[0]) || 1;
            const maxLevel = parseInt(levelRange[1]) || 999;

            return {
                key: key,
                name: data.name,
                emoji: data.emoji,
                min_level: minLevel,
                max_level: maxLevel,
                description: `Zona de nivel ${data.level_range}`,
                difficulty: 'Normal',
                is_active: true
            };
        })
    ];

    for (const zone of zones) {
        const { error } = await supabase
            .from('zones')
            .upsert(zone, { onConflict: 'key' });
        
        if (error) {
            console.error(`❌ Error inserting zone ${zone.key}:`, error.message);
        } else {
            console.log(`✅ Zone ${zone.key} upserted.`);
        }
    }

    // 2. Verify 'combats' table columns (Indirectly)
    // We can't check schema easily, but we can warn the user
    console.log('\n⚠️  IMPORTANT: To fix the "enemy_name" error, please run this SQL in your Supabase SQL Editor:');
    console.log(`
    ALTER TABLE combats 
    ADD COLUMN IF NOT EXISTS enemy_name TEXT,
    ADD COLUMN IF NOT EXISTS enemy_level INTEGER,
    ADD COLUMN IF NOT EXISTS enemy_rarity TEXT,
    ADD COLUMN IF NOT EXISTS xp_earned INTEGER,
    ADD COLUMN IF NOT EXISTS gold_earned INTEGER,
    ADD COLUMN IF NOT EXISTS items_earned_json JSONB;
    `);

    console.log('\n✅ Fix script completed.');
}

fixSupabase();
