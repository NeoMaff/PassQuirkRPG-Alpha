-- 🛠️ REPARACIÓN DEFINITIVA DE ZONAS (SIN LÍMITES)

-- 1. Desbloquear permisos (RLS)
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for service role" ON zones;
DROP POLICY IF EXISTS "Enable update for service role" ON zones;
CREATE POLICY "Enable insert for service role" ON zones FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for service role" ON zones FOR UPDATE USING (true);

-- 2. Crear columnas faltantes (si no existen)
ALTER TABLE zones ADD COLUMN IF NOT EXISTS emoji TEXT;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS min_level INTEGER DEFAULT 1;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS max_level INTEGER DEFAULT 99999; -- Por defecto muy alto
ALTER TABLE combats ADD COLUMN IF NOT EXISTS enemy_level INTEGER DEFAULT 1;

-- 3. Insertar Zonas Oficiales
-- NOTA: max_level se establece en 99999 para indicar "Sin Límite"
-- Los REINOS y el BOSQUE INICIAL comienzan en nivel 1.
-- Las otras zonas tienen su requisito mínimo de nivel.

INSERT INTO zones (key, name, description, min_level, max_level, emoji, is_active) VALUES
('bosque_inicial', 'Mayoi - Bosque Inicial', 'Requisito: Nivel 1.', 1, 99999, '🌲', true),
('reino_mirai', 'Reino Mirai (Humanos)', 'Sin requisito de nivel.', 1, 99999, '👤', true),
('reino_kyojin', 'Reino Kyojin (Ogros)', 'Sin requisito de nivel.', 1, 99999, '🧌', true),
('reino_kogane', 'Reino Kogane (Enanos)', 'Sin requisito de nivel.', 1, 99999, '🪓', true),
('reino_seirei', 'Reino Seirei (Elfos)', 'Sin requisito de nivel.', 1, 99999, '🧝', true),
('ryuuba', 'Ryuuba - Costa de los Dragones', 'Requisito: Nivel 10.', 10, 99999, '🏖️', true),
('llanuras', 'Llanuras Centrales', 'Requisito: Nivel 25.', 25, 99999, '🌾', true),
('murim', 'Murim - Refugio de Proscritos', 'Requisito: Nivel 40.', 40, 99999, '🏴‍☠️', true),
('machia', 'Machia - Laboratorio', 'Requisito: Nivel 60.', 60, 99999, '🧪', true),
('dungeon_x', 'Dungeon X', 'Requisito: Nivel 80.', 80, 99999, '🏛️', true),
('hellfire', 'Hellfire', 'Requisito: Nivel 90.', 90, 99999, '🔥', true)
ON CONFLICT (key) DO UPDATE SET
name = EXCLUDED.name,
description = EXCLUDED.description,
min_level = EXCLUDED.min_level,
max_level = EXCLUDED.max_level,
emoji = EXCLUDED.emoji;
