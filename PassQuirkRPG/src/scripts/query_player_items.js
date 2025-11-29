require('dotenv').config({ path: 'e:/PassQuirk/PassQuirkRPG/.env' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const username = 'ciomaff';

  // 1. Obtener ID del usuario
  const { data: player, error: pError } = await supabase
    .from('players')
    .select('user_id, username')
    .eq('username', username)
    .single();

  if (pError || !player) {
    console.error('❌ Jugador no encontrado:', pError?.message);
    return;
  }

  console.log(`👤 Jugador encontrado: ${player.username} (${player.user_id})`);

  // 2. Consultar items
  const { data: items, error: iError } = await supabase
    .from('player_items')
    .select('*')
    .eq('user_id', player.user_id);

  if (iError) {
    console.error('❌ Error consultando items:', iError.message);
  } else {
    console.log(`📦 Items en inventario (${items.length}):`);
    if (items.length === 0) {
      console.log('   (Inventario vacío)');
    } else {
      items.forEach(item => {
        console.log(`   - [${item.item_id}] x${item.quantity} (Equipado: ${item.is_equipped})`);
      });
    }
  }
}

main();
