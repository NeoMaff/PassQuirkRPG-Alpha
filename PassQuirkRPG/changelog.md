# Changelog

## [Unreleased] - 2025-11-29

### ☁️ Despliegue y Mecánicas (Vercel & Huida)
- **Despliegue Vercel**:
  - Configurado `web-interface/server.js` y `vercel.json` para despliegue del **Dashboard Web** en Vercel.
  - ⚠️ **Nota**: El Bot (proceso principal) requiere un host persistente como Railway.
- **Mecánica de Huida**:
  - Implementada recarga progresiva de intentos de huida (`fleeAttempts`).
  - Cada **5 pasos** de exploración (Auto/Manual) se recupera 1 intento de huida (Max 3).

### 🛠️ Correcciones Técnicas (Interacciones Discord)
- **Estabilidad en Exploración**:
  - Solucionados errores `DiscordAPIError[10062]` (Unknown interaction) y `DiscordAPIError[40060]` (Interaction already acknowledged) en los eventos de **Minería** y **Pesca**.
  - Implementado uso de `deferReply({ ephemeral: true })` inmediato en botones de recolección para evitar timeouts en operaciones de base de datos.
  - Estandarizado el flujo de respuesta usando `editReply` para mensajes de éxito/error en eventos interactivos.

### ⛏️ Exploración y Recolección
- **Validación de Herramientas**:
  - Ahora se verifica que el jugador tenga el **Pico Mundano** o la **Caña Mundana** en su inventario antes de permitir picar o pescar.
  - Mensajes de error claros si falta la herramienta o el nivel (Nivel 5), sin bloquear la exploración.
  - Añadida información visual en el embed de evento sobre la herramienta requerida.
- **Experiencia por Recolección**:
  - Añadida ganancia de **2 XP** por cada item recolectado en exploración (minería/pesca/hallazgos).
  - Visualización de XP actual añadida al embed de exploración junto al porcentaje de nivel.
- **Corrección de Errores**:
  - Solucionado crash al intentar picar/pescar sin datos o herramientas.

### ⚔️ Sistema de Combate
- **Uso de Objetos**:
  - Implementada funcionalidad completa para el botón "Inventario" en combate.
  - **Hierbas Medicinales**: Ahora curan **30 HP**.
  - **Pociones de Salud**: Curan **50 HP**.
  - **Pociones de Maná**: Restauran **30 MP**.
  - Los objetos se consumen correctamente del inventario y se registra la acción en el log de batalla.

### 🐛 Correcciones Críticas Previas
- **Base de Datos (Supabase)**:
  - ✅ Solucionado error de Foreign Key `players_current_zone_fk`: Se han insertado todas las zonas oficiales en la tabla `zones` para asegurar la integridad referencial.
  - 🔧 Corregido error `Could not find the 'enemy_name' column` en tabla `combats`.
