const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

console.log('🔍 Verificando configuración de base de datos...');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl) {
    console.error('❌ Error: SUPABASE_URL no encontrado en .env');
} else {
    console.log(`✅ SUPABASE_URL encontrado: ${supabaseUrl.substring(0, 15)}...`);
}

if (!supabaseKey) {
    console.error('❌ Error: SUPABASE_KEY no encontrado en .env');
} else {
    console.log(`✅ SUPABASE_KEY encontrado: ${supabaseKey.substring(0, 10)}...`);
}

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    try {
        console.log('🔄 Conectando a Supabase...');
        const { data, error, count } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Error de conexión:', error.message);
            console.error('Detalles:', error);
        } else {
            console.log(`✅ Conexión exitosa!`);
            console.log(`📊 Total de jugadores en base de datos: ${count}`);
        }

        // Prueba de escritura
        console.log('✍️ Probando escritura (Upsert)...');
        const testId = 'test_verify_db';
        const { error: upsertError } = await supabase
            .from('players')
            .upsert({
                user_id: testId,
                username: 'TestUser',
                level: 1,
                json_data: { test: true },
                last_seen: new Date().toISOString()
            });

        if (upsertError) {
            console.error('❌ Error de escritura:', upsertError.message);
        } else {
            console.log('✅ Escritura exitosa.');
            
            // Limpieza
            console.log('🧹 Limpiando datos de prueba...');
            const { error: deleteError } = await supabase
                .from('players')
                .delete()
                .eq('user_id', testId);
                
            if (deleteError) console.error('⚠️ Error al limpiar:', deleteError.message);
            else console.log('✅ Limpieza completada.');
        }

    } catch (err) {
        console.error('❌ Excepción no controlada:', err);
    }
})();
