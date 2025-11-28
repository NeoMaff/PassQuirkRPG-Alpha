const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'e:/PassQuirk/PassQuirkRPG/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Environment Debug:');
console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Set' : 'Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ASSETS_DIR = 'e:/PassQuirk/PassQuirkRPG/Documentación - Juego/Assets - PassQuirkRPG/Clases - Emoji - PassQuirk';

const FILES_TO_UPLOAD = [
    { name: 'class_alma_naciente.png', original: 'Alma naciente - Clase - PassQuirk.png' },
    { name: 'class_ancestral.png', original: 'Ancestral - Clase - PassQuirk.png' },
    { name: 'class_celestial.png', original: 'Celesital - Clase - PassQuirk.png' }, // Note typo in original filename
    { name: 'class_fenix.png', original: 'Fénix - Clase - PassQuirk.png' },
    { name: 'class_nigromante.png', original: 'Nigromante - Clase - PassQuirk.png' },
    { name: 'class_shinobi.png', original: 'Shinobi - Clase - PassQuirk.png' },
    { name: 'class_void.png', original: 'Void - Clase - PassQuirk.png' }
];

async function uploadAssets() {
    console.log('🚀 Starting upload of class assets...');

    for (const file of FILES_TO_UPLOAD) {
        const filePath = path.join(ASSETS_DIR, file.original);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            continue;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const { data, error } = await supabase.storage
            .from('images')
            .upload(file.name, fileBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) {
            console.error(`❌ Error uploading ${file.name}:`, error.message);
        } else {
            const { data: publicUrlData } = supabase.storage
                .from('images')
                .getPublicUrl(file.name);

            console.log(`✅ Uploaded ${file.name}: ${publicUrlData.publicUrl}`);
        }
    }
}

uploadAssets();
