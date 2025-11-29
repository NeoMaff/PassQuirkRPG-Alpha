require('dotenv').config({ path: 'e:/PassQuirk/PassQuirkRPG/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkTables() {
    const tables = ['classes', 'game_data_classes', 'official_classes', 'races', 'official_races', 'skills', 'abilities', 'class_abilities', 'game_data_abilities'];
    
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ Table '${table}' not found or error: ${error.message}`);
        } else {
            console.log(`✅ Table '${table}' exists. Columns:`, data.length > 0 ? Object.keys(data[0]).join(', ') : 'No rows to infer columns');
        }
    }
}

checkTables();
