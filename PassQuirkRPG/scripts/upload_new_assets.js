const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadFile(filePath, bucket, targetPath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            return null;
        }

        const fileContent = fs.readFileSync(filePath);
        console.log(`📤 Uploading ${path.basename(filePath)}...`);

        const { data, error } = await supabase
            .storage
            .from(bucket)
            .upload(targetPath, fileContent, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) {
            console.error('❌ Upload error:', error);
            return null;
        } else {
            const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(targetPath);
            console.log(`✅ Uploaded: ${targetPath}`);
            return publicUrlData.publicUrl;
        }
    } catch (err) {
        console.error('❌ Unexpected error:', err);
        return null;
    }
}

async function main() {
    const assetsBase = 'e:/PassQuirk/PassQuirkRPG/Documentación - Juego/Assets - PassQuirkRPG';

    const filesToUpload = [
        // Clases
        { path: path.join(assetsBase, 'Clases - Emoji - PassQuirk/Alma naciente - Clase - PassQuirk.png'), name: 'class_alma_naciente.png' },
        { path: path.join(assetsBase, 'Clases - Emoji - PassQuirk/Ancestral - Clase - PassQuirk.png'), name: 'class_ancestral.png' },
        { path: path.join(assetsBase, 'Clases - Emoji - PassQuirk/Celesital - Clase - PassQuirk.png'), name: 'class_celestial.png' },
        { path: path.join(assetsBase, 'Clases - Emoji - PassQuirk/Fénix - Clase - PassQuirk.png'), name: 'class_fenix.png' },
        { path: path.join(assetsBase, 'Clases - Emoji - PassQuirk/Nigromante - Clase - PassQuirk.png'), name: 'class_nigromante.png' },
        { path: path.join(assetsBase, 'Clases - Emoji - PassQuirk/Shinobi - Clase - PassQuirk.png'), name: 'class_shinobi.png' },
        { path: path.join(assetsBase, 'Clases - Emoji - PassQuirk/Void - Clase - PassQuirk.png'), name: 'class_void.png' },

        // Razas
        { path: path.join(assetsBase, 'Razas/Elfos - Razas - PassQuirk.png'), name: 'race_elfos.png' },
        { path: path.join(assetsBase, 'Razas/Enanos - Razas - PassQuirk.png'), name: 'race_enanos.png' },
        { path: path.join(assetsBase, 'Razas/Humanos - Razas - PassQuirk.png'), name: 'race_humanos.png' },
        { path: path.join(assetsBase, 'Razas/Ogros - Razas - PassQuirk.png'), name: 'race_ogros.png' },

        // Emojis ID
        { path: path.join(assetsBase, 'ID Emojis/ID Emojis - Ataque Básico - PassQuirk.png'), name: 'icon_attack_basic.png' },
        { path: path.join(assetsBase, 'ID Emojis/ID Emojis - Clases- PassQuirk.png'), name: 'icon_classes.png' },
        { path: path.join(assetsBase, 'ID Emojis/ID Emojis - Poder Básico - PassQuirk.png'), name: 'icon_power_basic.png' },
        { path: path.join(assetsBase, 'ID Emojis/ID Emojis - Poder Especial - PassQuirk.png'), name: 'icon_power_special.png' },
        { path: path.join(assetsBase, 'ID Emojis/ID Emojis - Razas - PassQuirk.png'), name: 'icon_races.png' }
    ];

    const results = {};

    for (const file of filesToUpload) {
        const url = await uploadFile(file.path, 'images', file.name);
        if (url) {
            results[file.name] = url;
        }
    }

    console.log('\n--- PUBLIC URLS ---');
    console.log(JSON.stringify(results, null, 2));
}

main();
