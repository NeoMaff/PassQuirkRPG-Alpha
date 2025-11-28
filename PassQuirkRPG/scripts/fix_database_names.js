const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateDatabase() {
    console.log('🚀 Iniciando migración de base de datos...');

    // 1. Migrar nombres de items en player_items (Simple -> Mundane)
    // Mapeo de nombres viejos a nuevos (keys)
    const itemRenames = {
        'simple_pickaxe': 'mundane_pickaxe',
        'pico_simple': 'mundane_pickaxe',
        'simple_rod': 'mundane_rod',
        'cana_simple': 'mundane_rod',
        'simple_sword': 'mundane_sword',
        'espada_simple': 'mundane_sword'
    };

    console.log('🔄 Migrando items de inventario...');
    
    for (const [oldKey, newKey] of Object.entries(itemRenames)) {
        // Buscar items con la key vieja
        const { data: items, error: fetchError } = await supabase
            .from('player_items')
            .select('*')
            .eq('item_key', oldKey);

        if (fetchError) {
            console.error(`Error buscando ${oldKey}:`, fetchError.message);
            continue;
        }

        if (items && items.length > 0) {
            console.log(`Found ${items.length} items with key '${oldKey}'. Migrating to '${newKey}'...`);
            
            for (const item of items) {
                // Verificar si ya tiene el nuevo item para fusionar cantidades
                const { data: existingNew, error: checkError } = await supabase
                    .from('player_items')
                    .select('*')
                    .eq('user_id', item.user_id)
                    .eq('item_key', newKey)
                    .single();

                if (existingNew) {
                    // Fusionar: sumar cantidad al nuevo y borrar el viejo
                    const newQuantity = existingNew.quantity + item.quantity;
                    await supabase
                        .from('player_items')
                        .update({ quantity: newQuantity })
                        .eq('id', existingNew.id);
                    
                    await supabase
                        .from('player_items')
                        .delete()
                        .eq('id', item.id);
                        
                    console.log(`Merged ${item.quantity} from ${oldKey} to ${newKey} for user ${item.user_id}`);
                } else {
                    // Renombrar: actualizar key
                    const { error: updateError } = await supabase
                        .from('player_items')
                        .update({ item_key: newKey })
                        .eq('id', item.id);
                        
                    if (updateError) console.error(`Failed to rename ${oldKey} for user ${item.user_id}:`, updateError.message);
                    else console.log(`Renamed ${oldKey} to ${newKey} for user ${item.user_id}`);
                }
            }
        }
    }

    // 2. Limpiar campo 'gems' de jugadores (JSON Data)
    console.log('💎 Limpiando gemas de datos de jugadores...');
    
    // Obtener todos los jugadores (paginado si fueran muchos, pero por ahora simple)
    const { data: players, error: playersError } = await supabase
        .from('players')
        .select('user_id, json_data');

    if (playersError) {
        console.error('Error fetching players:', playersError.message);
    } else {
        let gemsRemovedCount = 0;
        for (const player of players) {
            const jsonData = player.json_data;
            let modified = false;

            // Verificar y eliminar gems del root o inventory
            if (jsonData.gems !== undefined) {
                delete jsonData.gems;
                modified = true;
            }
            if (jsonData.inventory && jsonData.inventory.gems !== undefined) {
                delete jsonData.inventory.gems;
                modified = true;
            }

            if (modified) {
                const { error: saveError } = await supabase
                    .from('players')
                    .update({ json_data: jsonData })
                    .eq('user_id', player.user_id);
                
                if (!saveError) gemsRemovedCount++;
            }
        }
        console.log(`Gems removed from ${gemsRemovedCount} players.`);
    }

    console.log('✅ Migración completada.');
}

migrateDatabase().catch(console.error);
