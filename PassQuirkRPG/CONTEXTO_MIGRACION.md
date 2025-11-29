# 📘 CONTEXTO TÉCNICO COMPLETO: PassQuirk RPG Bot
> **Versión:** Alpha 1.6
> **Fecha:** 29/11/2025
> **Stack:** Node.js v16+, Discord.js v14, Supabase (PostgreSQL).

---

## 1. 🎨 Filosofía de Diseño y UI (Embeds)
**Regla de Oro:** *Estética > Funcionalidad Cruda*. No uses texto plano si puedes usar un Embed.

### Colores Oficiales (`src/utils/embedStyles.js`)
*   **Rojo Principal:** `#FF6B6B` (PassQuirk Red)
*   **Combate:** `#FF4444` (Peligro/Acción)
*   **Exploración:** `#45B7D1` (Turquesa/Aventura)
*   **Inventario:** `#8B4513` (Marrón/Cuero)
*   **Rarezas:**
    *   Mundano: `#95A5A6` (Gris)
    *   Refinado: `#2ECC71` (Verde)
    *   Sublime: `#3498DB` (Azul)
    *   Supremo: `#9B59B6` (Púrpura)
    *   Legendario: `#F39C12` (Dorado)

### Estructura de Embeds
Siempre usa `OfficialEmbedBuilder` (wrapper) o sigue este patrón manual:
```javascript
const embed = new EmbedBuilder()
    .setColor(COLORS.EXPLORATION)
    .setTitle(`${EMOJIS.EXPLORE} Título con Emoji`) // Emojis animados si aplica
    .setDescription(`
        **Subtítulo o Estado**
        Descripción detallada con *cursiva* para ambiente.
        
        > 💡 **Tip:** Bloques de cita para consejos o stats.
    `)
    .setFooter({ text: 'PassQuirk RPG • Sistema Oficial', iconURL: '...' });
```

### Emojis Animados (Obligatorio)
No uses emojis de Discord default si hay uno animado definido en `src/utils/embedStyles.js` o `passquirk-official-data.js`.
*   **Estrellas:** `https://cdn3.emoji.gg/emojis/58229-sparklestars.gif`
*   **Fuego:** `https://cdn3.emoji.gg/emojis/7384-greenfire.gif`

---

## 2. 🗄️ Arquitectura de Base de Datos (Supabase)
El bot usa Supabase como backend persistente. No hay modelos ORM, se usan queries directas.

### Tablas Principales
1.  **`players`**:
    *   `user_id` (PK, Text): ID de Discord.
    *   `xp` (Int): Experiencia total.
    *   `level` (Int): Nivel actual.
    *   `race` (JSONB): Objeto completo de raza `{ id, name, emoji, multipliers }`.
    *   `class` (JSONB): Objeto completo de clase.
    *   `stats` (JSONB): `{ hp, maxHp, mp, maxMp, atk, def, spd }`.
    *   `current_zone` (Text): Key de la zona actual.
    *   `inventory` (JSONB): *Legacy* (Usar `player_items` ahora).

2.  **`player_items`** (Inventario Real):
    *   `user_id` (FK -> players).
    *   `item_key` (Text): ID del item (ej: `mundane_pickaxe`, `health_potion`).
    *   `quantity` (Int).
    *   `equipped_slot` (Text/Null).

3.  **`explorations`** (Sesiones):
    *   `id` (UUID).
    *   `user_id` (FK).
    *   `status` (active/completed).
    *   `stats` (JSONB): `{ itemsFound, enemiesDefeated, distance }`.

4.  **`items`** (Catálogo - Parcialmente implementado):
    *   `key` (PK), `name`, `rarity_id`, `category`.

---

## 3. ⚙️ Lógica de Sistemas Críticos

### 🗺️ Sistema de Exploración (`exploration-system.js`)
*   **Flujo:** El usuario inicia sesión -> Se crea registro en `activeExplorations` (Map en memoria) -> Interactúa con botones.
*   **Modos:**
    *   **Manual:** Avanza 10-30m. Puede no encontrar nada (30%). Consume menos recursos.
    *   **Auto:** Avanza 50-150m. Siempre encuentra algo (Enemigo/Item).
*   **Regeneración Pasiva:** Al caminar (cualquier modo), se regenera **5% HP** por paso. Esto es vital para recuperar la capacidad de huir.
*   **Validaciones:**
    *   **Minería/Pesca:** Requiere `mundane_pickaxe` / `mundane_rod` en inventario y Nivel 5+.
    *   **Errores:** Se manejan con `deferReply` inmediato para evitar `Unknown Interaction`.

### ⚔️ Sistema de Combate (`combat-system.js`)
*   **Turnos:** Jugador -> Enemigo.
*   **Acciones:**
    *   **Atacar:** Daño físico básico.
    *   **Habilidad:** Consume MP (si está implementado).
    *   **Objeto:** Abre submenú filtrado (`health_potion`, `mana_potion`, `hierba_medicinal`).
    *   **Huir:** Probabilidad dinámica `(0.2 + %HP_Actual)`. Si tienes 10% vida, solo tienes 30% de chance de huir.
*   **Drops:** XP y PassCoins al ganar.

### 🎒 Inventario (`inventory-system.js`)
*   Usa `player_items` con join a `items` (si existe) o fallback a datos generados en vuelo.
*   **Crash Fix:** Se parcheó `rarity_id.toLowerCase()` para manejar objetos nulos o mal formados.

---

## 4. 📜 Historial de Decisiones y Contexto
*   **¿Por qué no Vercel?** Vercel mata procesos a los 10s. Este bot usa WebSockets (`client.login()`) y necesita persistencia. Se recomienda Railway/VPS.
*   **XP:** Se gana 2 XP por recoger items (feedback visual inmediato).
*   **Emojis:** Se migró a usar `passquirk-official-data.js` como fuente de verdad para evitar discrepancias entre emojis de texto y IDs reales (`<:elfos:123...>`).

## 5. 🗺️ Estructura de Archivos
```text
e:/PassQuirk/PassQuirkRPG/
├── src/
│   ├── systems/           # Lógica Core (Exploration, Combat, Inventory)
│   ├── commands/slash/    # Comandos (explorar.js, inventario.js)
│   ├── data/
│   │   ├── player-database.js        # DAO de Supabase
│   │   └── passquirk-official-data.js # JSONs estáticos (Razas, Clases, Assets)
│   └── utils/embedStyles.js          # Colores y Emojis
```

**Instrucción Final:** Al retomar, verifica siempre `changelog.md` y usa `TodoWrite` para no perder el hilo.

---

## 6. 📚 Base de Conocimiento Oficial (passquirk-official-data.js)

Esta sección contiene la **única fuente de verdad** para los datos del juego. NO inventar datos. Usar estas constantes.

### 🧬 Razas (`RACES`)
*   **Humanos** (`humanos`):
    *   **Emoji:** `<:HumanosRazasPassQuirk:1443592330014883840>`
    *   **Stats:** HP x1.1, MP x1.1, ATK x1.1, Magic x1.1, EXP x1.1.
    *   **Bonos:** Equilibrados.
*   **Ogros** (`ogros`):
    *   **Emoji:** `<:ogros:1442155305491234947>`
    *   **Stats:** HP x1.4, MP x1.3, DEF x1.2, SPD x0.8, Magic x0.9.
    *   **Bonos:** Tanques, regeneración de MP plana (+3).
*   **Elfos** (`elfos`):
    *   **Emoji:** `<:elfos:1442155303985610762>`
    *   **Stats:** HP x0.75, ATK x0.85, DEF x0.8, SPD x1.1, Magic x1.4.
    *   **Bonos:** Magia pura, reducción coste habilidades.
*   **Enanos** (`enanos`):
    *   **Emoji:** `<:enanos:1442155302651822250>`
    *   **Stats:** HP x0.8, ATK x1.15, SPD x1.3, Magic x0.85.
    *   **Bonos:** Crítico (+20% base), velocidad.

### 🛡️ Clases Base (`BASE_CLASSES`)
Cada clase tiene habilidades desbloqueables (Nvl 5, 10, 15).

1.  **CELESTIAL** (Soporte/DPS Mágico):
    *   Emoji: `<:CelesitalClasePassQuirk:1441941085436776608>`
    *   Skills: Rayo Sagrado (Dmg), Destello Divino (Heal/Dmg), Juicio Celestial (AoE/Purify).
2.  **FÉNIX** (DPS/Supervivencia):
    *   Emoji: `<:FnixClasePassQuirk:1441938882206765247>`
    *   Skills: Garra Ígnea (Dmg), Llamarada Vital (Burn/Heal), Renacimiento (Auto-Revive).
3.  **VOID** (DPS Rango/Espacial):
    *   Emoji: `<:VoidClasePassQuirk:1441941115543752755>`
    *   Skills: Pulso Vacío, Grieta Espacial (Ignore DEF), Colapso (Slow AoE).
4.  **SHINOBI** (Asesino/Movilidad):
    *   Emoji: `<:ShinobiClasePassQuirk:1441941114771734630>`
    *   Skills: Corte Sombra, Sombra Ígnea (Evasion), Espada Planetaria (Pierce).
5.  **ALMA NACIENTE** (Bruiser/Ki):
    *   Emoji: `<:AlmanacienteClasePassQui:1441941113555521677>`
    *   Skills: Puño Ki, Energía de Ki (Regen MP), Cataclismo (Low HP scaling).
6.  **NIGROMANTE** (Tanque/Summon):
    *   Emoji: `<:NicromanteClasePassQuirk:1441941112301289523>`
    *   Skills: Orbe Necrótico, Magia Negra (Lifesteal), Invocación (Execute).
7.  **ANCESTRAL** (Counter/Híbrido - **NO SELECCIONABLE**):
    *   Emoji: `<:AncestralClasePassQuirk:1441941110648995891>`
    *   Skills: Golpe Primordial, Magia Antecesor (Counter), 7 Caminos (Combo).

### 🗺️ Zonas y Enemigos (`ENEMIES_BY_ZONE`)

*   **Bosque Inicial** (`bosque_inicial`): Nvl 1-10.
    *   `slime_bosque` (Mundano, 💧, Nvl 1-5).
    *   `lobo_sombrio` (Refinado, 🐺, Nvl 5-10).
*   **Reino Mirai** (`reino_mirai` - Humanos): Nvl 1-99.
    *   `ladron_callejero` (Mundano, 🗡️).
    *   `automata_defectuoso` (Refinado, 🤖).
*   **Reino Kyojin** (`reino_kyojin` - Ogros): Nvl 1-99.
    *   `elemental_fuego_menor` (Mundano, 🔥).
    *   `bestia_magma` (Refinado, 🌋).
*   **Reino Kogane** (`reino_kogane` - Enanos): Nvl 1-99.
    *   `golem_piedra` (Mundano, 🪨).
    *   `insecto_gigante` (Refinado, 🐛).
*   **Reino Seirei** (`reino_seirei` - Elfos): Nvl 1-99.
    *   `espiritu_bosque` (Mundano, 🍃).
    *   `guardian_ancestral` (Refinado, 🛡️).
*   **Ryuuba** (`ryuuba`): Nvl 10-25.
    *   `cangrejo_arena` (Mundano, 🦀).
    *   `tiburon_costero` (Refinado, 🦈).
    *   `sirena_coral` (Sublime, 🧜‍♀️).
*   **Llanuras** (`llanuras`): Nvl 25-40.
    *   `lobo_pradera` (Mundano, 🐕).
    *   `bisonte_salvaje` (Sublime, 🦬).
*   **Murim** (`murim`): Nvl 40-60.
    *   `bandido_renegado` (Supremo, 🥷).
    *   `asesino_elite` (Trascendente, 🗡️).
*   **Machia** (`machia`): Nvl 60-80.
    *   `kimera_alpha` (Supremo, 🧬).
    *   `kimera_experimental` (Celestial, 🧪).
*   **Dungeon X** (`dungeon_x`): Nvl 80+.
    *   `guardian_piso` (Supremo, 🗿).
    *   `sombra_eterna` (Dragón, 👻).
*   **Hellfire** (`hellfire`): Nvl 90-100+.
    *   `demonio_infernal` (Dragón, 👿).
    *   `avatar_caos` (Caos, 🌀).
    *   `devorador_mundos` (Cósmico, 🪐).

### 💎 Rarezas (`RARITIES`)
1.  **Mundano** (Gris) - x1.0
2.  **Refinado** (Verde) - x1.2
3.  **Sublime** (Azul) - x1.5
4.  **Supremo** (Morado) - x2.0
5.  **Trascendente** (Naranja) - x2.5
6.  **Celestial** (Amarillo/Dorado) - x3.5
7.  **Divino** (Blanco) - x5.0
8.  **Dragón** (Rojo) - x8.0
9.  **Caos** (Negro/Rojo) - x12.0
10. **Cósmico** (Galaxia) - x20.0
