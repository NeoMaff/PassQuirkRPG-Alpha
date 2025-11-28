const path = require('path');
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading .env from: ${envPath}`);
const result = require('dotenv').config({ path: envPath });

if (result.error) {
    console.error('Error loading .env:', result.error);
}

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_KEY:', SUPABASE_KEY ? 'Found (masked)' : 'Missing');

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const PLAYERS_FILE = path.join(__dirname, '../bot/data/players.json');

async function migrate() {
    console.log('🚀 Starting migration to Supabase...');

    if (!fs.existsSync(PLAYERS_FILE)) {
        console.error('❌ players.json not found!');
        process.exit(1);
    }

    const playersData = JSON.parse(fs.readFileSync(PLAYERS_FILE, 'utf8'));
    const players = Object.values(playersData);

    console.log(`Found ${players.length} players to migrate.`);

    let successCount = 0;
    let errorCount = 0;

    for (const player of players) {
        try {
            const { error } = await supabase
                .from('players')
                .upsert({
                    user_id: player.userId,
                    username: player.username,
                    level: player.level || 1,
                    real_power: player.realPower || 0,
                    json_data: player,
                    created_at: player.createdAt || new Date().toISOString(),
                    last_seen: player.lastSeen || new Date().toISOString()
                });

            if (error) {
                console.error(`❌ Error migrating ${player.username} (${player.userId}):`, error.message);
                errorCount++;
            } else {
                console.log(`✅ Migrated ${player.username}`);
                successCount++;
            }
        } catch (err) {
            console.error(`❌ Exception migrating ${player.username}:`, err);
            errorCount++;
        }
    }

    console.log('\n--- Migration Summary ---');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log('-------------------------');
}

migrate();
