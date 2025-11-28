# 🚨 CAMBIOS CRÍTICOS AL MAPA - Lista de Correcciones

> Este documento lista TODOS los cambios que deben aplicarse al mapa-documentacion.md  
> **Usa esto como checklist para actualizar manualmente**

---

## ✅ CAMBIOS OBLIGATORIOS

### 1. **DESBLOQUEO DE REINOS** ⚠️ CRÍTICO
**ANTES (Incorrecto):**
- Cada reino tenía su propia misión de desbloqueo

**AHORA (Correcto):**
```
MISIÓN TUTORIAL en Space Central:
• Completar elección de vida (raza + clase)
• Al completar → LOS 4 REINOS se desbloquean simultáneamente
• NO hay misión individual por reino
```

**Aplicar en líneas ~120-210** (sección Reinos):
Cambiar "NIVEL REQUERIDO: Desbloqueado por misión"
Por: "NIVEL REQUERIDO: Desbloqueado tras completar Misión Tutorial en Space Central"

---

### 2. **RAREZAS ACUMULATIVAS** ⚠️ CRÍTICO
**ANTES (Incorrecto):**
- Ryuuba: Solo Refinado + Sublime
- Llanuras: Solo Sublime + Supremo

**AHORA (Correcto - Sistema Acumulativo):**
```
Mayoi:         Mundano + Refinado
Ryuuba:        Mundano + Refinado + Sublime
Llanuras:      Mundano + Refinado + Sublime + Supremo
Murim/Machia:  Mundano + Refinado + Sublime + Supremo + Celestial + Cósmico
Dungeon X:     TODAS (según piso)
Hellfire:      Solo Dragón + Trascendente + Caos + Divino (sin rarezas bajas)
Reinos:        Solo Mundano + Refinado
```

**Aplicar en líneas ~215-430** (Zonas Apartadas):
Cambiar cada "RAREZA ENEMIGOS:" con la lista correcta acumulativa

---

### 3. **RAREZA 10: ELIMINADA**
La rareza "Divino" ha sido eliminada. El orden oficial es:
Mundano -> Refinado -> Sublime -> Supremo -> Trascendente -> Celestial -> Dragón -> Caos -> Cósmico

---

### 4. **EXPLORACIÓN EN REINOS**  
**Cambiar texto** (línea ~147-151):
```markdown
EXPLORACIÓN REINOS:
• Sistema aleatorio de encuentros
• Solo aparecen rarezas: Mundano + Refinado
• NO hay nivel requerido para explorar el reino
• Probabilidades bajas para incentivar zonas específicas
```

---

### 5. **MAYOI: ÚNICA ZONA 100% PROGRAMADA** ⚠️ CRÍTICO
**Añadir al final de la sección Mayoi** (después de línea ~254):
```markdown
⚠️ PROGRAMACIÓN - FASE ALFA:
═══════════════════════════════════════
MAYOI es la ÚNICA zona completamente programada en Fase Alfa.

INCLUYE:
✅ 2 Enemigos exclusivos (Slime del Bosque, Lobo Sombrío)
✅ Sistema de encuentros funcional
✅ Drops de items
✅ Sistema de minería (nodos de piedra)
✅ Sistema de pesca (zonas de agua)
✅ Misiones activas
✅ Sistema de exp y PassCoins

RESTO DE ZONAS (Ryuuba, Llanuras, Murim, Machia, Dungeon X, Hellfire):
❌ Solo estructura documental
❌ Enemigos diseñados pero NO programados
❌ NO hay encounters activos
❌ Se programarán en Fase 2+

RAZÓN: Probar sistema completo en 1 zona antes de replicar
```

---

### 6. **ZONAS: ESTRUCTURA COMPLETA PARA TODAS**
Para CADA zona (Ryuuba, Llanuras, Murim, Machia), añadir:

**Ryuuba:**
```markdown
ENEMIGOS EXCLUSIVOS:
├─ Cangrejo de Arena (Mundano)
├─ Tiburón Costero (Refinado)
└─ [NO programados aún - Solo Fase 2]

OBJETOS EXCLUSIVOS:
├─ Perlas comunes
├─ Conchas brillantes
└─ [NO programados aún - Solo Fase 2]
```

**Llanuras:**
```markdown
ENEMIGOS EXCLUSIVOS:
├─ Lobo de Pradera (Mundano)
├─ Bisonte Salvaje (Sublime)
└─ [NO programados aún - Solo Fase 2]

OBJETOS EXCLUSIVOS:
├─ Hierbas raras
├─ Flores místicas
└─ [NO programados aún - Solo Fase 2]
```

**Murim:**
```markdown
ENEMIGOS EXCLUSIVOS:
├─ Bandido Renegado (Supremo)
├─ Asesino de Elite (Celestial)
└─ [NO programados aún - Solo Fase 2]
```

**Machia:**
```markdown
ENEMIGOS EXCLUSIVOS:
├─ Kimera Alpha (Supremo)
├─ Kimera Experimental (C ósmico)
└─ [NO programados aún - Solo Fase 2]
```

---

### 7. **SISTEMA DE EXPLORACIÓN MEJORADO**
Reescribir sección "Comando: /explorar" (líneas ~523-542):

```markdown
### **Comando: /explorar**

INFORMACIÓN MOSTRADA:
┌───────────────────────────────────────┐
│ 🌲 Explorando: [Nombre Zona]          │
│ 📍 Ubicación: [Sublocalización]       │
│ 🕐 Hora local: 14:35                  │
│ 🌍 Hora global: Día 5, Tarde          │
│ ☀️ Clima: Soleado / Lluvioso / etc.   │
└───────────────────────────────────────┘

MODOS DE EXPLORACIÓN:
1. Automático:
   • Bot explora solo
   • Muestra resultados automáticamente
   • Combates requieren intervención
   
2. Manual:
   • Botón "Siguiente"
   • Usuario controla paso a paso
   • Más control, más lento

FLUJO:
1. Usuario usa /explorar
2. Bot muestra info de ubicación actual
3. Usuario elige:
   ├─ Explorar aquí (Modo Automático/Manual)
   └─ Viajar a... (Sistema de viaje)
4. Sistema genera encuentro:
   ├─ Enemigo (40%)
   ├─ Objeto/ítem (25%)
   ├─ Nodo de minería (15%)
   ├─ Zona de pesca (10%)
   └─ Nada (10%)
5. Resultado procesado
```

---

### 8. **SEMILLAS DE TP (No "Items de TP")**
Cambiar sección "Items de Teletransporte" (líneas ~498-519):

```markdown
### **Semillas de Teletransporte**  
┌─────────────────────────────────────────────────┐
│ SISTEMA DE TELETRANSPORTE RÁPIDO                │
├─────────────────────────────────────────────────┤
│ Semillas mágicas que permiten viaje instantáneo │
└─────────────────────────────────────────────────┘

TIPOS DE SEMILLAS:
├─ Semilla de Space Central (Común)
│  └─ Viaje directo a Space Central
│  └─ Coste: 200 PassCoins (tienda)
│
├─ Semilla de Reino (Rara)
│  └─ Viaje a cualquier reino desbloqueado
│  └─ Coste: 500 PassCoins / Drop boss
│
└─ Semilla Universal (Épica)
   └─ Viaje a cualquier zona desbloqueada
   └─ Coste: 1500 PassCoins / Drop boss raro

OBTENCIÓN:
• Tienda de Space Central (caro)
• Drops de bosses (baja probabilidad)
• Recompensas de misiones
• [Futuro] Crafteo
```

---

### 9. **SISTEMA DE METROS Y TIEMPO**
Añadir en sección "Exploración de Caminata" (después de línea ~485):

```markdown
SISTEMA DE DISTANCIA:
┌───────────────────────────────────────┐
│ Destino: Reino Kyojin                 │
│ Distancia: 2500 metros                │
│ Tiempo estimado: 8 minutos            │
│ Ruta: Mirai → Mayoi → Kyojin          │
│                                       │
│ Progreso:                             │
│ [████████░░░░░░░░] 1200/2500m         │
│                                       │
│ Encuentros en ruta: 3/5 completados   │
└───────────────────────────────────────┘

MECÁNICA:
• Metros se reducen automáticamente
• Contador en tiempo real
• Encuentros garantizados en ruta
• Zonas intermedias obligatorias
```

---

### 10. **PROBABILIDADES CON RAREZAS ESPECÍFICAS**
Reescribir sección "Probabilidades de Encuentros" (líneas ~544-569) con:

```markdown
### **Probabilidades de Encuentros**

#### **En MAYOI (Ejemplo - Zona Programada)**
```
POOL DE ENCUENTROS:
• Enemigos de Mayoi (Slime, Lobo)
• Objetos de Mayoi
• Nodos de minería (15%)
• Zonas de pesca (5%)

PROBABILIDAD POR RAREZA:
┌──────────────┬──────────────┬──────────────┐
│ Tipo         │ Rareza       │ Probabilidad │
├──────────────┼──────────────┼──────────────┤
│ Enemigo      │ Mundano      │ 30%          │
│ Enemigo      │ Refinado     │ 10%          │
│ Objeto       │ Mundano      │ 20%          │
│ Objeto       │ Refinado     │ 5%           │
│ Minería      │ Mundano      │ 10%          │
│ Minería      │ Refinado     │ 5%           │
│ Pesca        │ Mundano      │ 3%           │
│ Pesca        │ Refinado     │ 2%           │
│ Nada         │ -            │ 15%          │
└──────────────┴──────────────┴──────────────┘
TOTAL: 100%
```

#### **En REINOS (Exploración Aleatoria)**
```
POOL DE ENCUENTROS: Todo desbloqueado
RAREZAS PERMITIDAS: Solo Mundano + Refinado

PROBABILIDADES:
┌──────────────────────┬───────────────┐
│ Tipo                 │ Probabilidad  │
├──────────────────────┼───────────────┤
│ Enemigo (Mundano)    │ 35%           │
│ Enemigo (Refinado)   │ 15%           │
│ Objeto (Mundano)     │ 20%           │
│ Objeto (Refinado)    │ 10%           │
│ Minería (Mundano)    │ 5%            │
│ Minería (Refinado)   │ 3%            │
│ Pesca (Mundano)      │ 5%            │
│ Pesca (Refinado)     │ 2%            │
│ Nada                 │ 5%            │
└──────────────────────┴───────────────┘
TOTAL: 100%

OBJETIVO: Incentivar ir a zonas específicas
```
```

---

### 11. **SPACE CENTRAL - NUEVOS SERVICIOS**
Ya aplicado en edición anterior, verificar que incluya:
- Hotel con Misión de habitación
- El Sabio (NPC para tutorial y lore)
- Arena PvP
- Gremios
- Tienda con Pico/Caña inicial

---

## 📋 **NUEVA SECCIÓN: SISTEMA NEKOTINA**
Añadir al final del documento (antes de "Ideas Futuras"):

```markdown
---

## ⛏️ SISTEMA NEKOTINA (Minería y Pesca)

> Ver documentación completa en: `sistema-nekotina.md`

### **Resumen**
Sistema de recolección pasiva durante exploración:
- ⛏️ Minería con Picos (9 rarezas)
- 🎣 Pesca con Cañas (9 rarezas)
- 🔨 Crafteo y reparación
- 💰 Generación de PassCoins
- 🧱 Materiales para equipamiento

### **Integración**
Durante exploración hay 15% probabilidad de nodo de minería y 10% de zona de pesca.

**Ver detalles completos en**: [`sistema-nekotina.md`](./sistema-nekotina.md)
```

---

## ✅ VERIFICACIÓN FINAL

Después de aplicar TODOS estos cambios, el documento debe tener:

1. ✅ Mapa visual con TODAS las zonas
2. ✅ Space Central con los 6 servicios nuevos
3. ✅ Desbloqueo correcto (1 misión tutorial → 4 reinos)
4. ✅ Rarezas acumulativas en TODAS las zonas
5. ✅ 10 rarezas (añadido Divino)
6. ✅ Mayoi marcada como única zona programada
7. ✅ Resto de zonas con estructura completa pero NO programadas
8. ✅ Probabilidades con rarezas explícitas
9. ✅ Sistema de exploración mejorado (auto/manual)
10. ✅ Semillas de TP (no "items genéricos")
11. ✅ Sistema de metros y tiempo
12. ✅ Referencia al Sistema Nekotina

---

**IMPORTANTE:**  
Este documento NO reemplaza `mapa-documentacion.md`.  
Úsalo como **guía para hacer las ediciones manualmente** en el archivo principal.

---

**Creado**: 2025-11-28  
**Propósito**: Checklist de correcciones para mapa v2.0
