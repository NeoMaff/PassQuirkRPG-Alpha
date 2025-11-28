const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'e:/PassQuirk/PassQuirkRPG/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images';

const EMOJI_DATA = [
    // Tabla 1: Ataques Físicos
    { name: 'RayoSagradoAtaqueFsicoC...', id: '1441983138782904461', category: 'basic_attack', ref: 'celestial' },
    { name: 'GarragneaAtaqueFsicoFnix', id: '1441983137679671438', category: 'basic_attack', ref: 'fenix' },
    { name: 'PulsodelVacoAtaqueBsicoV...', id: '1441983136316784642', category: 'basic_attack', ref: 'void' },
    { name: 'CorteSombraAtaqueBsicoS...', id: '1441983134852710400', category: 'basic_attack', ref: 'shinobi' },
    { name: 'PuoKiAtaqueBsicoAlmaNa...', id: '1441983132898169034', category: 'basic_attack', ref: 'alma_naciente' },
    { name: 'OrbeNecrticoAtaqueBsico...', id: '1441983131870564483', category: 'basic_attack', ref: 'nigromante' },
    { name: 'GolpePrimordialAtaqueBsi...', id: '1441983130633502860', category: 'basic_attack', ref: 'ancestral' },

    // Tabla 2: Clase Pass Quirk (Iconos de clase)
    { name: 'VoidClasePassQuirk', id: '1441941115543752755', category: 'class_icon', ref: 'void' },
    { name: 'ShinobiClasePassQuirk', id: '1441941114771734630', category: 'class_icon', ref: 'shinobi' },
    { name: 'AlmanacienteClasePassQui...', id: '1441941113555521677', category: 'class_icon', ref: 'alma_naciente' },
    { name: 'NicromanteClasePassQuirk', id: '1441941112301289523', category: 'class_icon', ref: 'nigromante' },
    { name: 'AncestralClasePassQuirk', id: '1441941110648995891', category: 'class_icon', ref: 'ancestral' },
    { name: 'CelesitalClasePassQuirk', id: '1441941085436776608', category: 'class_icon', ref: 'celestial' },
    { name: 'FnixClasePassQuirk1', id: '1441938882206765247', category: 'class_icon', ref: 'fenix' },

    // Tabla 3: Poder Físico (Power)
    { name: 'DestelloDivinoPoderFsic', id: '1441983178557489173', category: 'power', ref: 'celestial' },
    { name: 'LlamaradaVitalPoderFsico...', id: '1441983176481177620', category: 'power', ref: 'fenix' },
    { name: 'GrietaEspacialPoderFsicoV...', id: '1441983175399047228', category: 'power', ref: 'void' },
    { name: 'SombragneaPoderFsicoShi...', id: '1441983174132633610', category: 'power', ref: 'shinobi' },
    { name: 'EnergadeKiPoderFsicoAlm...', id: '1441983172803035187', category: 'power', ref: 'alma_naciente' },
    { name: 'MgiadelAntecesoPoderFsic... (Power)', id: '1441983171775434773', category: 'power', ref: 'ancestral' },
    { name: 'MgiadelAntecesoAtaquFsicoAncestr', id: '1441983170550694081', category: 'power', ref: 'ancestral' }, // Updated by user request

    // Tabla 4: Poder Especial
    { name: 'JuicioCelestialPoderEspeci...', id: '1441993545216032768', category: 'special', ref: 'celestial' },
    { name: 'RenacimientoenCenizasPo...', id: '1441993544272445543', category: 'special', ref: 'fenix' },
    { name: 'ColapsoGravitatorioPoderE...', id: '1441993542775078974', category: 'special', ref: 'void' },
    { name: 'EspadaPlanetariaPoderEsp...', id: '1441993540535193723', category: 'special', ref: 'shinobi' },
    { name: 'CataclismoCosmicaPoderEs...', id: '1441993539209793637', category: 'special', ref: 'alma_naciente' },
    { name: 'InvocacindeMuertePoderEs...', id: '1441993538312077395', category: 'special', ref: 'nigromante' },
    { name: '7CaminosAntiguosPoderEs...', id: '1441993537196658758', category: 'special', ref: 'ancestral' },

    // Tabla 5: Razas
    { name: 'HumanosRazasPassQuirk', id: '1442155313976315956', category: 'race', ref: 'humanos' },
    { name: 'OgrosRazasPassQuirk', id: '1442155305491234947', category: 'race', ref: 'ogros' },
    { name: 'ElfosRazasPassQuirk', id: '1442155303985610762', category: 'race', ref: 'elfos' },
    { name: 'EnanosRazasPassQuirk', id: '1442155302651822250', category: 'race', ref: 'enanos' }
];

const CLASS_DATA = {
    celestial: { name: 'Celestial', icon: `${BASE_URL}/class_celestial.png` },
    fenix: { name: 'Fénix', icon: `${BASE_URL}/class_fenix.png` },
    void: { name: 'Void', icon: `${BASE_URL}/class_void.png` },
    shinobi: { name: 'Shinobi', icon: `${BASE_URL}/class_shinobi.png` },
    alma_naciente: { name: 'Alma Naciente', icon: `${BASE_URL}/class_alma_naciente.png` },
    nigromante: { name: 'Nigromante', icon: `${BASE_URL}/class_nigromante.png` },
    ancestral: { name: 'Ancestral', icon: `${BASE_URL}/class_ancestral.png` }
};

async function populate() {
    console.log('🚀 Populating database...');

    // 1. Insert Emojis
    for (const emoji of EMOJI_DATA) {
        const { error } = await supabase
            .from('official_emojis')
            .upsert({
                name: emoji.name,
                discord_id: emoji.id,
                category: emoji.category
            }, { onConflict: 'discord_id' });

        if (error) console.error(`❌ Error inserting emoji ${emoji.name}:`, error.message);
        else console.log(`✅ Inserted emoji: ${emoji.name}`);
    }

    // 2. Insert Classes
    for (const [key, data] of Object.entries(CLASS_DATA)) {
        // Find the class icon emoji ID
        const emojiRef = EMOJI_DATA.find(e => e.category === 'class_icon' && e.ref === key);
        const emojiId = emojiRef ? emojiRef.id : null;

        const { error } = await supabase
            .from('official_classes')
            .upsert({
                name: data.name,
                icon_url: data.icon,
                emoji_id: emojiId
            }, { onConflict: 'name' });

        if (error) console.error(`❌ Error inserting class ${data.name}:`, error.message);
        else console.log(`✅ Inserted class: ${data.name}`);
    }
}

populate();
