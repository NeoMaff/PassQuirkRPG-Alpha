
# Supabase Schema & Documentation

## 1. Introducción
PassQuirk RPG utiliza una arquitectura híbrida. Para el desarrollo local y pruebas, se utilizan archivos JSON (`local-players.json`). Para producción, se utiliza **Supabase (PostgreSQL)**.
Este documento detalla el esquema de base de datos necesario para soportar todas las funcionalidades del bot, incluyendo el **Sistema de Mundo**, **Inventario** y **Exploración**.

## 2. Tablas Principales

### `players` (Tabla Maestra)
Almacena la información central del usuario.
```sql
CREATE TABLE players (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    class TEXT, -- ID de la clase (ej: 'ALMA_NACIENTE')
    race TEXT, -- ID de la raza (ej: 'HUMANOS')
    kingdom TEXT, -- ID del reino (ej: 'reino_mirai')
    level INTEGER DEFAULT 1,
    experience BIGINT DEFAULT 0,
    gold BIGINT DEFAULT 0, -- PassCoins
    gems INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    json_data JSONB -- Backup completo del objeto jugador para flexibilidad
);
```

### `world_state` (Sistema de Mundo)
Controla el tiempo y clima global del juego.
```sql
CREATE TABLE world_state (
    id SERIAL PRIMARY KEY,
    cycle TEXT DEFAULT 'day', -- 'day', 'night'
    weather TEXT DEFAULT 'Soleado', -- 'Soleado', 'Lluvia', 'Tormenta', 'Niebla'
    local_time TIME DEFAULT '12:00:00',
    last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
*Nota: El bot debe leer/escribir en esta tabla cada X minutos para sincronizar el ciclo día/noche.*

### `player_inventory` (Mochila)
Normalización del inventario para consultas rápidas y prevención de duplicados.
```sql
CREATE TABLE player_inventory (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES players(user_id),
    item_id TEXT NOT NULL, -- ID del item en el catálogo
    quantity INTEGER DEFAULT 1,
    metadata JSONB, -- Para items con stats variables (ej: durabilidad, encantamientos)
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);
```

### `items` (Catálogo Oficial de Objetos)
Tabla ya existente en el proyecto (referencia):
```sql
-- PK: key (TEXT)
-- Campos: name, type, rarity_id (FK → rarities.id), value, stats_json, icon_url
-- FKs: items_rarity_id_fkey → rarities.id
```

### PassCoins (Players.gold)
El balance actual de PassCoins se almacena en `players.gold` (INTEGER).

### `wallet_transactions` (Ledger de PassCoins)
Libro mayor de transacciones para auditoría y estadísticas.
```sql
CREATE TABLE wallet_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT REFERENCES players(user_id),
    amount BIGINT NOT NULL CHECK (amount > 0),
    direction TEXT NOT NULL CHECK (direction IN ('earn','spend','transfer_in','transfer_out')),
    source TEXT, -- origen lógico: 'combat', 'exploration', 'hotel', 'shop', etc.
    metadata JSONB, -- datos adicionales (ej. item_id, enemy_id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_tx_created ON wallet_transactions(created_at DESC);
```

### Funciones y Triggers (Sincronización de PassCoins)
Actualizan `players.gold` cuando se inserta en el ledger.
```sql
CREATE OR REPLACE FUNCTION apply_wallet_tx_update_players_gold() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.direction IN ('earn','transfer_in') THEN
            UPDATE public.players SET gold = COALESCE(gold,0) + NEW.amount WHERE user_id = NEW.user_id;
        ELSE
            UPDATE public.players SET gold = GREATEST(COALESCE(gold,0) - NEW.amount, 0) WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_tx_update_players_gold
AFTER INSERT ON wallet_transactions
FOR EACH ROW EXECUTE FUNCTION apply_wallet_tx_update_players_gold();
```

Seguridad y consistencia (search_path):
```sql
-- Recomendado por los advisors: fijar search_path vacío y usar nombres totalmente cualificados
CREATE OR REPLACE FUNCTION public.apply_wallet_tx_update_players_gold()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.direction IN ('earn','transfer_in') THEN
            UPDATE public.players SET gold = COALESCE(gold,0) + NEW.amount WHERE user_id = NEW.user_id;
        ELSE
            UPDATE public.players SET gold = GREATEST(COALESCE(gold,0) - NEW.amount, 0) WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
```

### `exploration_sessions` (Historial)
Registro de sesiones de exploración activas o pasadas.
```sql
CREATE TABLE exploration_sessions (
    session_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES players(user_id),
    zone_id TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    events_log JSONB, -- Array de eventos ocurridos
    rewards_summary JSONB -- { coins: 100, items: [...] }
);
```

## 3. Emojis & Assets (Base de Datos)
Los emojis deben estar sincronizados con la base de datos para que el cliente web y el bot usen los mismos recursos.

### `game_assets`
```sql
CREATE TABLE game_assets (
    id TEXT PRIMARY KEY, -- ej: 'emoji_passcoin', 'img_banner_humanos'
    type TEXT, -- 'emoji', 'image', 'video'
    value TEXT, -- URL o ID de Discord (<:Name:ID>)
    description TEXT,
    category TEXT -- 'ui', 'race', 'class', 'item'
);
```

**Datos Iniciales Requeridos:**
```sql
INSERT INTO game_assets (id, type, value, category) VALUES
('emoji_passcoin', 'emoji', '<:PassCoin:1441951548719759511>', 'ui'),
('emoji_humanos', 'emoji', '<:HumanosRazasPassQuirk:1443592330014883840>', 'race'),
('emoji_ogros', 'emoji', '<:OgrosRazasPassQuirk:1442155305491234947>', 'race'),
('emoji_elfos', 'emoji', '<:ElfosRazasPassQuirk:1442155303985610762>', 'race'),
('emoji_enanos', 'emoji', '<:EnanosRazasPassQuirk:1442155302651822250>', 'race');
```

## 4. Políticas de Seguridad (RLS)
Ejemplo mínimo para desarrollo.
```sql
-- Activar RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública de catálogo (items) y assets
CREATE POLICY items_read_all ON items FOR SELECT USING (true);

-- Permitir al bot (service role) leer/escribir todo
-- (El token del bot debe usar la key de servicio en producción)
CREATE POLICY players_full_access ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY inventory_full_access ON player_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY wallet_tx_full_access ON wallet_transactions FOR ALL USING (true) WITH CHECK (true);
```

## 5. Vistas Útiles
Resumen rápido para dashboards y estadísticas.
```sql
CREATE OR REPLACE VIEW player_inventory_summary AS
SELECT p.user_id, p.username,
       SUM(pi.quantity) AS total_items,
       COUNT(DISTINCT pi.item_key) AS distinct_items,
       p.gold AS passcoins
FROM players p
LEFT JOIN player_items pi ON pi.user_id = p.user_id
GROUP BY p.user_id, p.username, p.gold;
```

## 6. Operaciones Comunes (SQL)
```sql
-- Aumentar PassCoins (earn)
INSERT INTO wallet_transactions(user_id, amount, direction, source, metadata)
VALUES ('<USER_ID>', 50, 'earn', 'hotel', '{"reason":"alquilar_habitacion"}');

-- Gastar PassCoins (spend)
INSERT INTO wallet_transactions(user_id, amount, direction, source, metadata)
VALUES ('<USER_ID>', 50, 'spend', 'hotel', '{"service":"room"}');

-- Añadir/Actualizar item del inventario
INSERT INTO player_items(user_id, item_key, quantity)
VALUES ('<USER_ID>', 'pocion_vida_basica', 1)
ON CONFLICT (user_id, item_key) DO UPDATE SET quantity = player_items.quantity + EXCLUDED.quantity;
```

## 7. Instrucciones de Actualización
1.  Crear las tablas mencionadas en el panel SQL de Supabase.
2.  Actualizar las Políticas RLS (Row Level Security) para permitir lectura pública de `world_state` y `game_assets`, y lectura/escritura autenticada (por el bot) en `players` e `inventory`.
3.  Ejecutar el script de migración de datos locales a Supabase cuando esté listo.
