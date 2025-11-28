const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const statsBase = 'e:/PassQuirk/PassQuirkRPG/Documentación - Juego/Assets - PassQuirkRPG/Stats - Image/Base';
const emojisBase = 'e:/PassQuirk/PassQuirkRPG/Documentación - Juego/Assets - PassQuirkRPG/ID Emojis';

async function uploadFile(filePath, fileName) {
    console.log(`Using Key: ${supabaseKey ? supabaseKey.substring(0, 5) + '...' : 'UNDEFINED'}`);

    try {
        const fileContent = fs.readFileSync(filePath);
        const { data, error } = await supabase
            .storage
            .from('images')
            .upload(fileName, fileContent, {
                contentType: 'image/png', // Assuming most are images, mime type detection could be better but png/jpeg usually works for display
                upsert: false
            });

        if (error && error.message !== 'The resource already exists') {
            console.error(`Error uploading ${fileName}:`, error.message);
            return null;
        }

        const { data: publicUrlData } = supabase
            .storage
            .from('images')
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
    } catch (err) {
        console.error(`Exception uploading ${fileName}:`, err.message);
        return null;
    }
}

async function main() {
    console.log('Iniciando subida de Stats y Emojis...');
    const results = { stats: {}, emojis: {} };

    // 1. Upload Stats Images
    if (fs.existsSync(statsBase)) {
        const files = fs.readdirSync(statsBase);
        for (const file of files) {
            const lowerName = file.toLowerCase();
            let className = '';

            if (lowerName.includes('alma naciente')) className = 'alma_naciente';
            else if (lowerName.includes('ancestral') && !lowerName.includes('counters')) className = 'ancestral';
            else if (lowerName.includes('celestial')) className = 'celestial';
            else if (lowerName.includes('fénix') || lowerName.includes('fenix')) className = 'fenix';
            else if (lowerName.includes('necromante') || lowerName.includes('nigromante')) className = 'nigromante';
            else if (lowerName.includes('shinobi')) className = 'shinobi';
            else if (lowerName.includes('void')) className = 'void';

            if (className) {
                const ext = path.extname(file);
                const newFileName = `stats_base_${className}${ext}`;
                console.log(`Subiendo ${file} como ${newFileName}...`);
                const url = await uploadFile(path.join(statsBase, file), newFileName);
                if (url) results.stats[className] = url;
            }
        }
    }

    // 2. Upload Emoji IDs
    if (fs.existsSync(emojisBase)) {
        const files = fs.readdirSync(emojisBase);
        for (const file of files) {
            const lowerName = file.toLowerCase();
            let type = '';

            if (lowerName.includes('ataque básico')) type = 'attack_basic';
            else if (lowerName.includes('clases')) type = 'classes';
            else if (lowerName.includes('poder básico')) type = 'power_basic';
            else if (lowerName.includes('poder especial')) type = 'power_special';
            else if (lowerName.includes('razas')) type = 'races';

            if (type) {
                const ext = path.extname(file);
                const newFileName = `id_emoji_${type}${ext}`;
                console.log(`Subiendo ${file} como ${newFileName}...`);
                const url = await uploadFile(path.join(emojisBase, file), newFileName);
                if (url) results.emojis[type] = url;
            }
        }
    }

    console.log('\n--- RESULTADOS JSON ---');
    console.log(JSON.stringify(results, null, 4));
}

main();
