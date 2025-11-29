require('dotenv').config({ path: 'e:/PassQuirk/PassQuirkRPG/.env' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const username = 'ciomaff';

  // Consultar items completos para ver las claves
  const { data: items, error } = await supabase
    .from('player_items')
    .select('*')
    .limit(1); // Solo uno para ver estructura

  if (error) console.error(error);
  else console.log('🔍 Estructura del primer item:', items[0]);
}

main();
