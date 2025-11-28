# 🛠️ Documentación de Base de Datos y Contexto para IA (Gemini 3 Pro + MCP)

**ESTE ARCHIVO ES PARA USO EXCLUSIVO DE LA IA GEMINI 3 PRO CON ACCESO MCP A SUPABASE.**

## 📌 Contexto del Proyecto
**PassQuirk RPG** es un bot de Discord de rol (RPG) que utiliza Supabase como backend.
La API local de Supabase no funciona, por lo que **TÚ (Gemini 3 Pro)** eres el encargado de administrar la base de datos mediante MCP en supabase que a ti si te funciona.

### ⚠️ Instrucciones Críticas para Gemini 3 Pro
1.  **Usa `mcp-supabase`** para ejecutar las queries.
2.  **No inventes datos.** Usa estrictamente los datos proporcionados en este documento (Razas, Clases, Rarezas Oficiales).
3.  **Estructura Híbrida:**
    *   **Tablas de Referencia:** `races`, `classes`, `rarities`, `items` (Para que la IA sepa qué existe y validar).
    *   **Tabla de Jugadores (`players`):** Usa una columna `data` tipo `JSONB` para almacenar el progreso, inventario y stats del jugador. Esto permite flexibilidad total.

---

## 1. Esquema de Base de Datos (SQL)

Ejecuta estos scripts SQL para inicializar o corregir la base de datos.

### 1.1. Tabla de Jugadores (JSONB)
Esta es la tabla principal. Todo el progreso se guarda en `data`.

```sql
CREATE TABLE IF NOT EXISTS public.players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE, -- ID de Discord
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para búsquedas rápidas en JSONB
CREATE INDEX IF NOT EXISTS idx_players_data ON public.players USING gin (data);
```

### 1.2. Tablas de Referencia (Datos Estáticos)

#### Tabla: Rarezas (Orden Oficial)
**Orden:** Mundano -> Refinado -> Sublime -> Supremo -> Trascendente -> Celestial -> Dragón -> Caos -> Cósmico

```sql
CREATE TABLE IF NOT EXISTS public.rarities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    rank INTEGER NOT NULL, -- 1 = Mundano, 9 = Cósmico
    color TEXT NOT NULL
);

INSERT INTO public.rarities (name, rank, color) VALUES
('Mundano', 1, ),
('Refinado', 2, ),
('Sublime', 3, ''),
('Supremo', 4, ),
('Trascendente', 5, ),
('Celestial', 6, ),
('Dragón', 7, ),
('Caos', 8, ),
('Cósmico', 9, )
ON CONFLICT (name) DO UPDATE SET rank = EXCLUDED.rank, color = EXCLUDED.color;
```

#### Tabla: Razas (Oficiales)
**Regla:** Las Razas NO tienen stats base, solo bonificadores (multiplicadores).

```sql
CREATE TABLE IF NOT EXISTS public.races (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE, -- 'HUMANOS', 'OGROS'...
    name TEXT NOT NULL,
    description TEXT,
    bonuses TEXT[] -- Descripción visual de bonus
);

INSERT INTO public.races (key, name, description, bonuses) VALUES
('HUMANOS', 'Humanos', 'Versátiles y equilibrados. Se adaptan a cualquier situación.', ARRAY['+10% HP, Energía, ATK', '+10% Poder Mágico', '+5% Velocidad', '+10% EXP']),
('OGROS', 'Ogros', 'Fuerza bruta y resistencia inigualable.', ARRAY['+40% HP', '+30% Energía', '+20% Defensa', '+3 Regen Energía', '-20% Velocidad']),
('ELFOS', 'Elfos', 'Ágiles y afines a la magia y la naturaleza.', ARRAY['+40% Poder Mágico', '+25% Regen Energía', '-20% Coste Habilidades', '+10% Velocidad', '-25% HP']),
('ENANOS', 'Enanos', 'Resistentes y expertos en forja y tecnología.', ARRAY['+30% Velocidad', '+20% Prob. Crítico', '+15% ATK Físico', '+25% Daño Armas', '-20% HP'])
ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, bonuses = EXCLUDED.bonuses;
```

#### Tabla: Clases (Oficiales)
**Regla:** Las Clases definen los STATS BASE (HP, MP, ATK, DEF, SPD).

```sql
CREATE TABLE IF NOT EXISTS public.classes (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE, -- 'CELESTIAL', 'FENIX'...
    name TEXT NOT NULL,
    role TEXT,
    style TEXT,
    description TEXT,
    base_stats JSONB NOT NULL -- { hp, mp, attack, defense, speed }
);

INSERT INTO public.classes (key, name, role, style, description, base_stats) VALUES
('CELESTIAL', 'Celestial', 'Soporte + DPS Mágico', 'Magia Sagrada + Área', 'Soporte + DPS Mágico. Magia Sagrada + Área.', '{"hp": 100, "mp": 100, "attack": 10, "defense": 7, "speed": 10}'),
('FENIX', 'Fénix', 'DPS + Supervivencia', 'Fuego + Regeneración', 'DPS + Supervivencia. Fuego + Regeneración.', '{"hp": 110, "mp": 80, "attack": 12, "defense": 6, "speed": 11}'),
('VOID', 'Void', 'DPS Largo Alcance', 'Magia Espacial + Penetración', 'DPS Largo Alcance. Magia Espacial + Penetración.', '{"hp": 90, "mp": 110, "attack": 13, "defense": 5, "speed": 12}'),
('SHINOBI', 'Shinobi', 'Asesino + Movilidad', 'Cuerpo a Cuerpo + Magia', 'Asesino + Movilidad. Cuerpo a Cuerpo + Magia.', '{"hp": 95, "mp": 70, "attack": 14, "defense": 4, "speed": 15}'),
('ALMA_NACIENTE', 'Alma Naciente', 'Bruiser + Ki', 'Ki + Magia Oscura', 'Bruiser + Ki. Ki + Magia Oscura.', '{"hp": 120, "mp": 60, "attack": 11, "defense": 8, "speed": 9}'),
('NIGROMANTE', 'Nigromante', 'Tanque + Invocación', 'Magia Negra + Sacrificio', 'Tanque + Invocación. Magia Negra + Sacrificio.', '{"hp": 115, "mp": 90, "attack": 9, "defense": 8, "speed": 10}'),
('ANCESTRAL', 'Ancestral', 'Counter Universal + Híbrido', 'Adaptativo + Magia Antigua', 'Counter Universal + Híbrido. Adaptativo + Magia Antigua.', '{"hp": 120, "mp": 120, "attack": 14, "defense": 9, "speed": 12}')
ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, style = EXCLUDED.style, description = EXCLUDED.description, base_stats = EXCLUDED.base_stats;
```

---

## 2. Estructura del JSONB (`players.data`)

El campo `data` de la tabla `players` debe seguir esta estructura JSON.
Esta estructura agrupa toda la información del jugador.

### Objeto Raíz
```json
{
  "profile": { ... },
  "stats": { ... },
  "inventory": { ... },
  "economy": { ... },
  "progression": { ... },
  "exploration": { ... }
}
```

### Detalle de Campos

#### 2.1. Perfil (`profile`)
```json
"profile": {
  "username": "NombreUsuario",
  "race": "HUMANOS",      // Key de tabla races
  "class": "CELESTIAL",   // Key de tabla classes
  "gender": "Masculino",  // Masculino / Femenino
  "level": 1,
  "experience": 0,
  "nextLevelExp": 100,
  "titles": ["Novato"],
  "joinedAt": "ISO_DATE"
}
```

#### 2.2. Estadísticas (`stats`)
Las stats se calculan: Base Clase * Mult Raza * Nivel.
```json
"stats": {
  "hp": 100,         // Vida actual
  "maxHp": 100,      // Vida máxima (Calculada)
  "mp": 50,          // Energía actual
  "maxMp": 50,       // Energía máxima (Calculada)
  "attack": 10,
  "defense": 5,
  "magic_power": 10,
  "speed": 10
}
```

#### 2.3. Economía (`economy`)
```json
"economy": {
  "passcoins": 0,    // Moneda principal
  "gems": 0          // Moneda premium
}
```

#### 2.4. Inventario (`inventory`)
```json
"inventory": {
  "items": [
    {
      "id": "pocion_vida",
      "name": "Poción de Vida",
      "quantity": 5,
      "rarity": "Mundano"
    }
  ],
  "weapons": [],
  "armors": [],
  "equipment": {
    "weapon": null,
    "armor": null,
    "accessory": null
  }
}
```

#### 2.5. Exploración (`exploration`)
```json
"exploration": {
  "currentZone": "Space Central",
  "unlockedZones": ["Space Central", "Mayoi", "Reino Mirai", "Reino Kyojin", "Reino Kogane", "Reino Seirei"],
  "lastExplored": "ISO_DATE"
}
```

#### 2.6. Misiones (`progression`)
```json
"progression": {
  "tutorialCompleted": true,
  "missions": {
    "mission_01_bosque": {
      "status": "active", // active, completed
      "progress": 0,
      "target": 50 // PassCoins a conseguir
    }
  }
}
```

---

## 3. Notas para la IA (Gemini)

*   **Creación de Jugador:** Al crear un jugador, inicializa el JSON `data` con los valores por defecto de Nivel 1, Stats Base de la Clase elegida y 0 PassCoins.
*   **Actualización:** Cuando el jugador gana EXP, oro o items, actualiza el JSON `data` usando `jsonb_set` o reemplazando el objeto completo.
*   **Consultas:** Puedes consultar campos específicos del JSON usando la sintaxis de flecha `->>` (ej: `data->'profile'->>'class'`).

## 4. Instrucciones de Juego y Combate (ACTUALIZADO)

### 4.1. Configuración de Zonas y Enemigos
*   **Limpieza de Datos:** DEBES asegurarte de que no existan enemigos "fantasma" o configuraciones residuales de versiones anteriores.
*   **Zona Mayoi (Bosque Inicial):**
    *   **Enemigos Permitidos:** ÚNICAMENTE `Slime del Bosque` (Nvl 1-5) y `Lobo Sombrío` (Nvl 5-10).
    *   **Prohibido:** Que aparezcan enemigos de otras zonas (ej. Sirena de Coral, Elemental de Fuego) en Mayoi.
    *   **Configuración en Código:** La lógica de exploración debe filtrar explícitamente los enemigos por la clave de zona.

### 4.2. Interfaz de Usuario (UI)
*   **Visualización de Perfil:** En los embeds de exploración, DEBES mostrar la Raza y Clase con sus **Emojis Oficiales** y nombres bien formateados (ej. `<:Humanos:123...> Humanos | <:AlmaNaciente:456...> Alma Naciente`). No muestres solo las claves internas (`humanos`, `alma_naciente`).
*   **Eventos Claros:** Cuando ocurra un evento (aparición de enemigo, hallazgo de ítem), el mensaje debe ser visualmente distinto y claro, usando negritas o bloques de código si es necesario para destacar la novedad.

### 4.3. Sistema de Huida
*   **Lógica de Intentos:** El jugador tiene **3 intentos de huida por cada encuentro con enemigo**.
*   **Reinicio:** El contador (3/3) se reinicia automáticamente al encontrar un NUEVO enemigo.
*   **Feedback Visual:** El botón de "Huir" debe actualizarse dinámicamente para mostrar los intentos restantes (ej. `Huir (2/3)`).
*   **Fallo:** Si la huida falla, el turno pasa al enemigo (o se notifica el fallo) y se resta un intento. Si llegan a 0, el botón se deshabilita o fuerza el combate.

### 4.4. Sistema de Combate
*   **Combate Real:** El botón "Combatir" NO puede ser una simulación de victoria instantánea.
*   **Requisito:** Debe iniciar una sesión de `CombatSystem` real, con turnos, cálculo de daño basado en stats, uso de habilidades y control de HP/MP.
*   **Flujo:** Exploración -> Encuentro Enemigo -> Botón Combatir -> Inicia Combate (Embed Nuevo) -> Fin Combate -> Retorno a Exploración (con recompensas o penalización por derrota).
