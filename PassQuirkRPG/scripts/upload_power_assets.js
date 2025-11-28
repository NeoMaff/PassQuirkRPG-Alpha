const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const assetsBase = 'e:/PassQuirk/PassQuirkRPG/Documentación - Juego/Assets - PassQuirkRPG/Clases - Emoji - PassQuirk/Poderes - Clases';

const folders = ['Ataque Básico', 'Poder Básico', 'Poder Especial'];

async function uploadFile(filePath, fileName) {
    console.log(`Using Key: ${supabaseKey ? supabaseKey.substring(0, 5) + '...' : 'UNDEFINED'}`);

    try {
        const fileContent = fs.readFileSync(filePath);
        const { data, error } = await supabase
            .storage
            .from('images')
            .upload(fileName, fileContent, {
                contentType: 'image/png',
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
    console.log('Iniciando subida de poderes...');
    const results = {};

    for (const folder of folders) {
        const folderPath = path.join(assetsBase, folder);
        if (!fs.existsSync(folderPath)) {
            console.warn(`Carpeta no encontrada: ${folderPath}`);
            continue;
        }

        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.png'));

        for (const file of files) {
            // Normalizar nombre para la URL (ej: "Rayo Sagrado - Ataque Básico - Celestial.png" -> "power_celestial_basic.png")
            // Estructura típica: "Nombre Poder - Tipo - Clase.png"
            // Ej: "Rayo Sagrado - Ataque Básico - Celestial.png"

            const lowerName = file.toLowerCase();
            let type = '';
            if (lowerName.includes('ataque básico')) type = 'basic';
            else if (lowerName.includes('poder básico')) type = 'power';
            else if (lowerName.includes('poder especial')) type = 'special';

            let className = '';
            if (lowerName.includes('celestial')) className = 'celestial';
            else if (lowerName.includes('fénix') || lowerName.includes('fenix')) className = 'fenix';
            else if (lowerName.includes('void')) className = 'void';
            else if (lowerName.includes('shinobi')) className = 'shinobi';
            else if (lowerName.includes('alma naciente')) className = 'alma_naciente';
            else if (lowerName.includes('nigromante')) className = 'nigromante';
            else if (lowerName.includes('ancestral') || lowerName.includes('anteceso')) className = 'ancestral';

            if (type && className) {
                const newFileName = `power_${className}_${type}.png`;
                console.log(`Subiendo ${file} como ${newFileName}...`);

                const url = await uploadFile(path.join(folderPath, file), newFileName);
                if (url) {
                    if (!results[className]) results[className] = {};
                    results[className][type] = url;
                    console.log(`✅ ${newFileName} subido.`);
                }
            } else {
                console.warn(`⚠️ No se pudo identificar clase/tipo para: ${file}`);
            }
        }
    }

    console.log('\n--- RESULTADOS JSON ---');
    console.log(JSON.stringify(results, null, 4));
}

main();
