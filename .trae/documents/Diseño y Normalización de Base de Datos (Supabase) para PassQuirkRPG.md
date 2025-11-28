# Objetivos
- Consolidar y normalizar el modelo de datos del bot en Supabase, alineado con el código actual.
- Mantener compatibilidad con las tablas existentes y flujos en producción.
- Preparar reglas RLS, índices y relaciones para rendimiento y seguridad.

# Estado Actual Detectado
- En uso directo: `players` con columnas: `user_id`, `username`, `json_data`, `level`, `class`, `race`, `current_zone`, `gold`, `updated_at`.
- Módulo alternativo (`database/supabase.js`) prevé tablas: `users`, `characters`, `inventories` (relación a `items`), `combats`, `explorations`, `enemies`, `zones`, `game_logs`.
- Scripts existentes: `official_emojis`, `official_classes`, `images` (catálogos y assets). 

# Modelo de Datos Propuesto
Mantener `players` como entidad canónica (por integrarse ya con el bot) y **normalizar componentes clave**:

1. `players` (canónica)
- `user_id` (PK, único), `username`
- `level`, `experience`, `next_level_exp`
- `class_key` (FK → `official_classes`), `race_key`
- `stats_json` (hp/mp/atk/def/spd), `inventory_gold`
- `current_zone_key`, `mission_id`, `mission_status`
- `created_at`, `updated_at`

2. `player_items`
- `user_id` (FK → `players.user_id`), `item_key` (FK → `items.key`)
- `quantity`, `equipped_slot` (weapon/armor/accessory/null)
- Índice compuesto `(user_id, item_key)`

3. `items` (catálogo)
- `key` (PK), `name`, `type` (weapon/armor/consumable/material), `rarity`
- `value`, `stats_json`, `icon_url`

4. `player_quirks` y `quirks`
- `quirks`: `id` (PK), `name`, `type` (combat/economy/progression), `description`, `bonus_json`
- `player_quirks`: `user_id` (FK), `quirk_id` (FK), `acquired_at`

5. `explorations`
- `id` (PK), `user_id` (FK), `zone_key` (FK → `zones.key`)
- `status` (active/paused/finished), `distance_total`, `distance_covered`
- `counters_json` (coins/items/chests/enemies/quirks), `last_event_json`

6. `combats`
- `id` (PK), `user_id` (FK), `enemy_key` (FK → `enemies.key`), `zone_key`
- `status` (active/finished), `turn_count`, `current_turn`
- `hp_snapshot_json` (player/enemy), `log_json`

7. `zones` (catálogo)
- `key` (PK), `name`, `description`, `difficulty`, `distance`, `image_url`

8. `enemies` (catálogo)
- `key` (PK), `zone_key` (FK), `name`, `rarity`, `level_min`, `level_max`
- `stats_json`, `loot_profile_json`

9. `game_logs`
- `id` (PK), `user_id` (FK), `action_type`, `payload_json`, `timestamp`

10. Catálogos ya existentes
- `official_emojis` (consumidos por UI de embeds), `official_classes`, `images`.

# Relaciones y Claves
- `players.user_id` ← `player_items.user_id`, `player_quirks.user_id`, `explorations.user_id`, `combats.user_id`, `game_logs.user_id`.
- Claves externas desde entidades transaccionales hacia catálogos: `class_key`, `race_key`, `item_key`, `zone_key`, `enemy_key`.

# Índices y Rendimiento
- Índices compuestos:
  - `player_items (user_id, item_key)`
  - `player_quirks (user_id, quirk_id)`
  - `explorations (user_id, status)`
  - `combats (user_id, status)`
- Campos consultados frecuentemente: `players.user_id`, `players.updated_at`, `players.current_zone_key`.

# Seguridad (RLS) y Acceso
- Activar RLS en tablas sensibles (`players`, `player_items`, `player_quirks`, `explorations`, `combats`, `game_logs`).
- Política típica: `user_id = auth.uid()` para lectura/escritura del **propietario**.
- Roles de servicio (clave de servicio) para procesos internos del bot que necesitan acceso amplio (separado del anon key).

# Migraciones y Compatibilidad
- Mantener `players.json_data` temporalmente para **compatibilidad** con el código actual mientras migramos campos a columnas nativas.
- Mapear `characters` → `players` (si estaba en uso en módulos legacy).
- `inventories` puede coexistir hasta migrar por completo a `player_items`.
- Revisión de scripts: conservar `populate_db_emojis.js`, `populate_db_classes.js`, `upload_*assets.js` (catálogos).

# Semillas y Catálogos
- `official_classes` y `images`: ya poblados por scripts.
- Sembrar `items`, `zones`, `enemies`, `quirks` mínimos para soportar:
  - Bosque Inicial, Space Central, Reinos Raciales.
  - Enemigos básicos (Slime Verde, etc.).
  - Ítems básicos (Poción Vida/Maná, Espada de Madera, Escudo de Madera).

# Funciones/Vistas (Opcional, sin código ahora)
- Vista `player_summary` para UI (join de `players`, `player_items` agregados, `player_quirks`).
- Función `award_passcoins(user_id, amount)` (segura) para economía.

# Auditoría y Logs
- `game_logs` como bitácora de acciones clave (combate, compra, viaje, misión).
- Índice por `user_id` y `timestamp` para consultas por usuario.

# Próximos Pasos (Una vez aprobada la planificación)
1. Crear migraciones DDL para nuevas tablas/índices/RLS manteniendo `players` vigente.
2. Poblar catálogos mínimos (`items`, `zones`, `enemies`, `quirks`).
3. Ajustar `player-database.js` para leer columnas nativas (mantener fallback JSON hasta completar).
4. Añadir vistas para paneles del bot (resúmenes y catálogos).

¿Confirmas este diseño para proceder con las migraciones en Supabase (sin tocar aún la lógica del bot)?