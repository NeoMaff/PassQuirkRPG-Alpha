
## [Unreleased] - 2025-11-28

### 🛠️ Herramientas de Desarrollo
- **Servidor MCP MongoDB**:
  - Integrado servidor local MCP para MongoDB en la raíz del proyecto.
  - Creado script `mcp/mongodb-server.js` con herramientas para listar colecciones, buscar, insertar, actualizar y eliminar documentos.
  - Añadido comando `npm run mcp:mongodb` para ejecutar el servidor.
  - Generada guía de configuración en `MCP_MONGODB_SETUP.md`.

### 🌟 Sistemas Principales
- **Sistema de Combate Real**:
  - Implementado combate por turnos interactivo (`CombatSystem`) reemplazando la simulación simple.
  - Integración de barras de vida (HP) y registro de batalla en tiempo real.
  - Lógica de victoria/derrota con recompensas y penalizaciones.

- **Exploración y Balance**:
  - **Escalas de Poder Reales**: Ahora los enemigos aplican multiplicadores de rareza a sus estadísticas (HP, Ataque) y recompensas (XP, PassCoins). Un enemigo "Cósmico" es significativamente más fuerte que uno "Mundano".
  - **Probabilidades Ajustadas**: Reducida frecuencia de combate (0.4 -> 0.2) en favor de eventos de items y minería/pesca.
  - **Cap de Rareza**: Implementado límite de rareza por zona para evitar enemigos/items de alto nivel en zonas iniciales.
  - **Minería y Pesca**: Desbloqueo reducido a Nivel 5. Los eventos ahora aparecen visualmente incluso si no tienes la herramienta (mensaje informativo).

- **Economía y Tienda**:
  - Eliminada moneda "Gemas" y categoría Premium por solicitud del usuario.
  - Renombrados items básicos para seguir nomenclatura de rareza (ej. "Pico Mundano" -> "Pico Simple").
  - Integración visual de emojis de rareza en el catálogo.
  - **PassCoins Oficiales**: Ahora se usa el emoji oficial `<:PassCoin:1441951548719759511>` en todos los mensajes de recompensas, tienda y perfil.

### 🐛 Correcciones y UI
- **Perfil (`/perfil`)**:
  - Corregidos emojis de Raza y Clase que se mostraban incorrectamente.
  - Renombrado campo "Magia" a "Quirk" (mostrando el nombre de la clase).
  - Ubicación ahora muestra la zona actual del jugador en lugar de "Tutorial".
- **Estabilidad**:
  - Solucionado crash en `/inventario` y `/perfil` causado por descripciones de embed vacías.
  - Solucionado error `TypeError` al usar métodos de `OfficialEmbedBuilder`.
  - **Corrección de Botones**: Solucionado error `Unknown interaction` en botones de "Continuar" después de combates.
- **Datos**:
  - Actualizado `emojisid.md` con la tabla oficial de rarezas.
  - Centralizada lógica de rarezas en `src/data/rarities.js`.
  - **Seguridad DB**: Creadas políticas RLS para `shop_listings`, `passystem_events` y `music_settings` para eliminar advertencias de seguridad.

### 💾 Persistencia
- **Verificación**: Confirmado que XP, Nivel y PassCoins se guardan correctamente en la base de datos Supabase.
- **Limpieza**: Eliminados campos obsoletos (`gems`) de la base de datos.
