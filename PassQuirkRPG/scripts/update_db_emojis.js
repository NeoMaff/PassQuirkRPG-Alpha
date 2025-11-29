require('dotenv').config({ path: 'e:/PassQuirk/PassQuirkRPG/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const DATA = {
    classes: {
        celestial: { emoji: "<:CelesitalClasePassQuirk:1441941085436776608>" },
        fenix: { emoji: "<:FnixClasePassQuirk:1441938882206765247>" },
        void: { emoji: "<:VoidClasePassQuirk:1441941115543752755>" },
        shinobi: { emoji: "<:ShinobiClasePassQuirk:1441941114771734630>" },
        alma_naciente: { emoji: "<:AlmanacienteClasePassQui:1441941113555521677>" },
        nigromante: { emoji: "<:NicromanteClasePassQuirk:1441941112301289523>" },
        ancestral: { emoji: "<:AncestralClasePassQuirk:1441941110648995891>" }
    },
    races: {
        humanos: { emoji: "<:HumanosRazasPassQuirk:1443592330014883840>" },
        ogros: { emoji: "<:ogros:1442155305491234947>" },
        elfos: { emoji: "<:elfos:1442155303985610762>" },
        enanos: { emoji: "<:enanos:1442155302651822250>" }
    },
    abilities: {
        celestial: {
            basic: { emoji: "<:RayoSagrado:1441983138782904461>" },
            power: { emoji: "<:DestelloDivino:1441983178557489173>" },
            special: { emoji: "<:JuicioCelestial:1441993545216032768>" }
        },
        fenix: {
            basic: { emoji: "<:Garragnea:1441983137679671438>" },
            power: { emoji: "<:LlamaradaVital:1441983176481177620>" },
            special: { emoji: "<:RenacimientoenCenizas:1441993544272445543>" }
        },
        void: {
            basic: { emoji: "<:PulsodelVaco:1441983136316784642>" },
            power: { emoji: "<:GrietaEspacial:1441983175399047228>" },
            special: { emoji: "<:ColapsoGravitatorio:1441993542775078974>" }
        },
        shinobi: {
            basic: { emoji: "<:CorteSombra:1441983134852710400>" },
            power: { emoji: "<:Sombragnea:1441983174132633610>" },
            special: { emoji: "<:EspadaPlanetaria:1441993540535193723>" }
        },
        alma_naciente: {
            basic: { emoji: "<:PuoKi:1441983132898169034>" },
            power: { emoji: "<:EnergadeKi:1441983172803035187>" },
            special: { emoji: "<:CataclismoCosmica:1441993539209793637>" }
        },
        nigromante: {
            basic: { emoji: "<:OrbeNecrtico:1441983131870564483>" },
            power: { emoji: "<:MgiadelAnteceso:1441983171775434773>" },
            special: { emoji: "<:InvocacindeMuerte:14419935383120773957>" }
        },
        ancestral: {
            basic: { emoji: "<:GolpePrimordial:1441983130633502860>" },
            power: { emoji: "<:MgiadelAnteceso:1441983170550694081>" },
            special: { emoji: "<:CaminosAntiguos:1441993537196658758>" }
        }
    }
};

async function updateEmojis() {
    console.log('🚀 Updating Emojis in Database...');

    // 1. Classes
    console.log('\n--- Updating Classes ---');
    for (const [key, data] of Object.entries(DATA.classes)) {
        const { error } = await supabase
            .from('classes')
            .update({ emoji: data.emoji })
            .eq('key', key); // Assuming 'key' column holds 'celestial', etc.
        
        if (error) console.log(`❌ Failed to update class ${key}: ${error.message}`);
        else console.log(`✅ Updated class ${key}`);
    }

    // 2. Races
    console.log('\n--- Updating Races ---');
    for (const [key, data] of Object.entries(DATA.races)) {
        const { error } = await supabase
            .from('races')
            .update({ emoji: data.emoji })
            .eq('key', key); // Assuming 'key' column
        
        if (error) console.log(`❌ Failed to update race ${key}: ${error.message}`);
        else console.log(`✅ Updated race ${key}`);
    }

    // 3. Abilities
    console.log('\n--- Updating Abilities ---');
    for (const [classKey, abilities] of Object.entries(DATA.abilities)) {
        for (const [skillKey, data] of Object.entries(abilities)) {
            // Update in class_abilities table
            // We match by class_key AND skill_key
            const { error } = await supabase
                .from('class_abilities')
                .update({ emoji: data.emoji })
                .match({ class_key: classKey, skill_key: skillKey });
            
            if (error) console.log(`❌ Failed to update ability ${classKey}/${skillKey}: ${error.message}`);
            else console.log(`✅ Updated ability ${classKey}/${skillKey}`);
        }
    }

    console.log('\n🏁 Emoji Update Complete.');
}

updateEmojis();
