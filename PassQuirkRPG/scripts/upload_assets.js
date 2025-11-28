const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Service role key would be better, but anon might work if policy allows

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadFile(filePath, bucket, targetPath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            return;
        }

        const fileContent = fs.readFileSync(filePath);

        console.log(`📤 Uploading ${path.basename(filePath)} to ${bucket}/${targetPath}...`);

        const { data, error } = await supabase
            .storage
            .from(bucket)
            .upload(targetPath, fileContent, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) {
            console.error('❌ Upload error:', error);
        } else {
            console.log('✅ Upload successful:', data);
            const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(targetPath);
            console.log('🔗 Public URL:', publicUrlData.publicUrl);
        }
    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

const EL_SABIO_PATH = 'e:/PassQuirk/PassQuirkRPG/documentation/Doc-Oficial/Imagenes - Diseño/Npc - Imagenes/Tutorial_Sabio.png';

uploadFile(EL_SABIO_PATH, 'images', 'Tutorial_Sabio.png');
