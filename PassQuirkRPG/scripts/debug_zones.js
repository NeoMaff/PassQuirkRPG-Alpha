require('dotenv').config({ path: 'e:/PassQuirk/PassQuirkRPG/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function debugZones() {
    console.log('🔍 Debugging Zones Table...');

    // Try to select one row
    const { data, error } = await supabase
        .from('zones')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error selecting from zones:', error.message);
        if (error.message.includes('relation "zones" does not exist')) {
            console.error('🚨 The table "zones" does NOT exist!');
        }
    } else {
        console.log('✅ Selected from zones:', data);
        if (data.length > 0) {
            console.log('   Columns:', Object.keys(data[0]));
        } else {
            console.log('   Table is empty.');
        }
    }
}

debugZones();
