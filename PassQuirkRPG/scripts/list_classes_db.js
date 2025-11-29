require('dotenv').config({ path: 'e:/PassQuirk/PassQuirkRPG/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function listClasses() {
    const { data, error } = await supabase.from('classes').select('*');
    if (error) {
        console.error('Error listing classes:', error);
    } else {
        console.log('Current classes in DB:', data);
    }
}

listClasses();
