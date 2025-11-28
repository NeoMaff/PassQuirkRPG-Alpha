require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { BASE_CLASSES } = require('../src/data/passquirk-official-data');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateClasses() {
    console.log('🚀 Populating official_classes...');

    const classes = Object.entries(BASE_CLASSES).map(([key, data]) => ({
        name: data.name || key, // Use name from data or key if missing
        description: data.description,
        emoji_id: data.emoji, // Assuming this is the emoji string or ID
        icon_url: data.image,
        stats: data.baseStats,
        role: data.role,
        style: data.style,
        abilities: data.abilities
    }));

    for (const cls of classes) {
        // Extract the ID from the emoji string if it's in format <:name:id>
        let emojiId = cls.emoji_id;
        const match = emojiId.match(/:(\d+)>/);
        if (match) {
            emojiId = match[1];
        }

        const { error } = await supabase
            .from('official_classes')
            .upsert({
                name: cls.name,
                description: cls.description,
                emoji_id: emojiId,
                icon_url: cls.icon_url,
                stats: cls.stats,
                role: cls.role,
                style: cls.style,
                abilities: cls.abilities
            }, { onConflict: 'name' });

        if (error) {
            console.error(`❌ Error inserting class ${cls.name}:`, error.message);
        } else {
            console.log(`✅ Class ${cls.name} inserted/updated.`);
        }
    }

    console.log('✨ Class population complete!');
}

populateClasses();
