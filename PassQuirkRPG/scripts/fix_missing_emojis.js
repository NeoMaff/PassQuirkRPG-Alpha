require('dotenv').config({ path: 'e:/PassQuirk/PassQuirkRPG/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const UPDATES = [
    {
        keys: ['FENIX', 'FÉNIX', 'fenix'],
        emoji: '<:FnixClasePassQuirk:1441938882206765247>'
    },
    {
        keys: ['ALMA NACIENTE', 'ALMA_NACIENTE', 'alma_naciente'],
        emoji: '<:AlmanacienteClasePassQui:1441941113555521677>'
    }
];

async function fixEmojis() {
    console.log('🔧 Fixing missing emojis...');

    for (const update of UPDATES) {
        const { keys, emoji } = update;
        console.log(`\nUpdating keys: ${keys.join(', ')} with emoji ${emoji}`);

        // Using 'in' filter to update multiple keys at once
        const { data, error } = await supabase
            .from('classes')
            .update({ emoji: emoji })
            .in('key', keys)
            .select();

        if (error) {
            console.error(`❌ Error updating: ${error.message}`);
        } else {
            console.log(`✅ Updated ${data.length} rows.`);
            data.forEach(row => console.log(`   - Updated ID ${row.id} (${row.key})`));
        }
    }
}

fixEmojis();
