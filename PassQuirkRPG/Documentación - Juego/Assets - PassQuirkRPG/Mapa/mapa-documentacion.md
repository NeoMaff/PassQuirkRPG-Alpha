# 🗺️ SISTEMA DE MAPA - PassQuirkRPG

## 📋 ÍNDICE
1. [Concepto General](#concepto-general)
2. [Estructura del Mundo](#estructura-del-mundo)
3. [Sistema de Viaje](#sistema-de-viaje)
4. [Zonas del Juego](#zonas-del-juego)
5. [Sistema de Exploración](#sistema-de-exploración)
6. [Progresión y Restricciones](#progresión-y-restricciones)
7. [Ideas Futuras](#ideas-futuras)

---

## 🌍 CONCEPTO GENERAL

### **Filosofía del Mapa**
PassQuirkRPG utiliza un sistema de mapa **progresivo y dinámico** que evoluciona con las actualizaciones del juego. El mundo comienza en "Año Cero", donde todo está en fase inicial y se expande con el tiempo.

### **Fases de Desarrollo**
```
FASE ALFA (Actual):
├─ 1 Continente: Alacrya
├─ 4 Reinos (solo capitales)
├─ 1 Zona Central: Space Central
├─ 6 Zonas Apartadas (Zone One)
└─ 1 Zone Caos: Hellfire

[IDEAS: NO DESARROLLAR]
FASE BETA (Futuro):
├─ Ciudades y pueblos en reinos
├─ Expansión de territorios
├─ Nuevas zonas apartadas
├─ Sistema de escuelas por raza
└─ Historia progresiva

FASE COMPLETA (Late-game):
├─ Múltiples continentes
├─ Cambios de nombre de capitales
├─ Zonas dinámicas basadas en historia
└─ Eventos mundiales
```

---

## 🗺️ ESTRUCTURA DEL MUNDO

### **CONTINENTE: ALACRYA**

```
                    Reino Kyojin (Ogros)
                           [🧌]
                            |
                      [🌲 Mayoi]
                            |
                            |
       [🏴‍☠️ Murim]    Space Central    [🧪 Machia]
            \              [⭐]              /
             \       [Arena PvP]           /
              \             |             /
     Reino Kogane -------- [o] -------- Reino Mirai
      (Enanos)       [🌾 Llanuras]      (Humanos)
        [🪓]                                [👤]
                            |
                      [🏖️ Ryuuba]
                            |
                      Reino Seirei
                        (Elfos)
                         [🧝]
                            |
                            |
                     [🏛️ Dungeon X]
                            |
                      [🔥 Hellfire]

LEYENDA:
⭐ Space Central - Hub neutral (Inicio)
🧌🪓👤🧝 - 4 Reinos (Ogros, Enanos, Humanos, Elfos)
🌲🏖️🌾 - Zonas Zone One (Mayoi, Ryuuba, Llanuras)
🏴‍☠️🧪 - Zonas Peligrosas (Murim, Machia)
🏛️ - Dungeon X (Mazmorra infinita)
🔥 - Hellfire (Zone Caos - End-game)
```

---

## 🏰 ZONAS DEL JUEGO

### **1. SPACE CENTRAL** ⭐
**Space Central** es el nexo principal donde convergen todas las razas y aventureros. Es el punto de partida y el corazón social del juego.

**CARACTERÍSTICAS:**
• **Zona Segura:** No hay combates ni enemigos.
• **Punto de Encuentro:** Todos los jugadores pueden interactuar aquí.
• **Tutorial:** Aquí comienza tu aventura con el Sabio.
• **Servicios:** Acceso a Hotel (Almacenamiento), Armería y Portal de los Reinos.

**CONEXIONES:**
• **Portal de los Reinos:** Conecta con los 4 Reinos Raciales (Mirai, Kyojin, Kogane, Seirei).
• **Salida Norte:** Conecta con **Mayoi** (Bosque Inicial).
• **Salida Sur:** Conecta con **Llanuras**.
• **Salida Este/Oeste:** Conecta con **Murim** y **Machia** (Zonas Peligrosas).

**SERVICIOS:**
├─ 🏨 **Hotel:** Almacenamiento de items (Requiere 50 PassCoins para desbloquear).
├─ ⚔️ **Armería:** Compra y venta de equipamiento básico.
├─ 🌀 **Portal de los Reinos:** Viaje instantáneo a tu Reino Racial.
├─ 🧙‍♂️ **El Sabio:** NPC para tutorial, lore y misiones.
├─ ⚔️ **Arena PvP:** Zona de combate entre jugadores (Fase Beta).
└─ 📜 **Tablón de Misiones:** Misiones diarias y encargos.

---

### **2. REINOS RACIALES (Capitales)**
Cada raza tiene su propio Reino Capital. Aunque son el hogar de una raza específica, **todas las razas pueden visitar todos los reinos** una vez desbloqueados.

**REGLAS DE LOS REINOS:**
• **DESBLOQUEO:** Se desbloquean **simultáneamente los 4 Reinos** tras completar la Misión Tutorial en Space Central.
• **SIN NIVEL:** No hay requisito de nivel para entrar o explorar.
• **EXPLORACIÓN:** Tienen sus propias zonas de exploración internas (arrabales, alcantarillas, jardines reales).
• **RAREZAS:** En los Reinos solo aparecen enemigos/items de rareza **Mundano** y **Refinado** inicialmente.
• **GUERRAS Y COMERCIO:** (Futuro) Posibilidad de guerras entre reinos y rutas comerciales.

#### **🏰 Reino Mirai (Humanos)** 👤
```
┌─────────────────────────────────────────────────┐
│ REINO MIRAI - Capital de la Humanidad           │
├─────────────────────────────────────────────────┤
│ TIPO: Reino/Capital                             │
│ NIVEL REQUERIDO: NINGUNO (Desbloqueado tras     │
│                  Tutorial)                      │
│ RAZA: Humanos (todas las razas pueden entrar)   │
│ RAREZAS: Mundano, Refinado                      │
└─────────────────────────────────────────────────┘

DESCRIPCIÓN:
Una metrópolis tecnológica y mágica donde la innovación
es ley. Grandes torres de cristal y acero.

EXPLORACIÓN:
• Zonas urbanas, callejones oscuros, laboratorios.
• Enemigos: Ladrones, Ratas Mutantes, Autómatas defectuosos.
```

#### **🏰 Reino Kyojin (Ogros)** 🧌
```
┌─────────────────────────────────────────────────┐
│ REINO KYOJIN - Capital de los Ogros             │
├─────────────────────────────────────────────────┤
│ TIPO: Reino/Capital                             │
│ NIVEL REQUERIDO: NINGUNO (Desbloqueado tras     │
│                  Tutorial)                      │
│ RAZA: Ogros (todas las razas pueden entrar)     │
│ RAREZAS: Mundano, Refinado                      │
└─────────────────────────────────────────────────┘

DESCRIPCIÓN:
Capital ogra construida en las montañas volcánicas
del norte. Fortaleza de piedra y fuego, donde la fuerza
es la única ley.

EXPLORACIÓN:
• Minas volcánicas, arenas de combate, forjas.
• Enemigos: Elementales de fuego menores, Bestias de magma.
```

#### **🏰 Reino Kogane (Enanos)** 🪓
```
┌─────────────────────────────────────────────────┐
│ REINO KOGANE - Capital de los Enanos            │
├─────────────────────────────────────────────────┤
│ TIPO: Reino/Capital                             │
│ NIVEL REQUERIDO: NINGUNO (Desbloqueado tras     │
│                  Tutorial)                      │
│ RAZA: Enanos (todas las razas pueden entrar)    │
│ RAREZAS: Mundano, Refinado                      │
└─────────────────────────────────────────────────┘

DESCRIPCIÓN:
Una inmensa ciudad subterránea llena de oro y
mecanismos complejos. La tecnología y la tradición
se funden en las profundidades.

EXPLORACIÓN:
• Túneles antiguos, bóvedas olvidadas, vías de tren.
• Enemigos: Golems de piedra, Insectos gigantes.
```

#### **🏰 Reino Seirei (Elfos)** 🧝
```
┌─────────────────────────────────────────────────┐
│ REINO SEIREI - Capital de los Elfos             │
├─────────────────────────────────────────────────┤
│ TIPO: Reino/Capital                             │
│ NIVEL REQUERIDO: NINGUNO (Desbloqueado tras     │
│                  Tutorial)                      │
│ RAZA: Elfos (todas las razas pueden entrar)     │
│ RAREZAS: Mundano, Refinado                      │
└─────────────────────────────────────────────────┘

DESCRIPCIÓN:
Un reino etéreo integrado en un árbol gigante.
La magia fluye libremente y la naturaleza es sagrada.

EXPLORACIÓN:
• Ramas gigantes, santuarios corruptos, bosques oníricos.
• Enemigos: Espíritus corruptos, Plantas carnívoras.
```

---

### **3. ZONES (Zonas de Exploración)**
Las **Zones** son áreas fuera de la seguridad de Space Central y los Reinos. Aquí es donde la verdadera aventura comienza.

**SISTEMA DE RAREZA ACUMULATIVA:**
Las zonas más avanzadas incluyen las rarezas de las anteriores, pero con probabilidades ajustadas.

#### **🌲 Mayoi - El Bosque Perdido (Zone One)**
```
┌─────────────────────────────────────────────────┐
│ MAYOI - Bosque Inicial                          │
├─────────────────────────────────────────────────┤
│ TIPO: Zona de Exploración (Bosque)              │
│ NIVEL RECOMENDADO: 1-10                         │
│ DIFICULTAD: ⭐ Fácil                             │
│ RAREZA ENEMIGOS: Mundano, Refinado              │
│ ESTADO: ✅ 100% PROGRAMADO                      │
└─────────────────────────────────────────────────┘

DESCRIPCIÓN:
Un bosque denso y misterioso que rodea Space Central.
Es la primera prueba para los aventureros novatos.
La niebla cambia de lugar los caminos.

ENEMIGOS (Programados):
├─ Slime del Bosque (Mundano) - HP: 50, ATK: 5
└─ Lobo Sombrío (Refinado) - HP: 120, ATK: 15

RECURSOS:
• Madera, Piedra, Hierbas medicinales.
```

#### **🏖️ Ryuuba - La Costa de los Dragones**
```
┌─────────────────────────────────────────────────┐
│ RYUUBA - Costa                                  │
├─────────────────────────────────────────────────┤
│ TIPO: Zona de Exploración (Playa)               │
│ NIVEL RECOMENDADO: 10-25                        │
│ DIFICULTAD: ⭐⭐ Media                           │
│ RAREZA ENEMIGOS: Mundano, Refinado, Sublime     │
│ ESTADO: 📝 Diseño (Fase 2)                      │
└─────────────────────────────────────────────────┘

DESCRIPCIÓN:
Playas de arena negra y aguas cristalinas donde
antiguamente anidaban dragones.

ENEMIGOS EXCLUSIVOS (Diseño):
├─ Cangrejo Acorazado (Refinado)
└─ Sirena de Coral (Sublime)
```

#### **🌾 Llanuras Centrales**
```
┌─────────────────────────────────────────────────┐
│ LLANURAS CENTRALES                              │
├─────────────────────────────────────────────────┤
│ TIPO: Zona de Exploración (Prado)               │
│ NIVEL RECOMENDADO: 25-40                        │
│ DIFICULTAD: ⭐⭐⭐ Media-Alta                    │
│ RAREZA ENEMIGOS: Mundano, Refinado, Sublime,    │
│                  Supremo                        │
│ ESTADO: 📝 Diseño (Fase 2)                      │
└─────────────────────────────────────────────────┘

DESCRIPCIÓN:
Vastas extensiones de hierba alta donde manadas de
bestias salvajes vagan libremente.

ENEMIGOS EXCLUSIVOS (Diseño):
├─ Lobo de Pradera (Mundano)
└─ Bisonte Salvaje (Sublime)
```

#### **🏴‍☠️ Murim - Refugio de los Proscritos**
```
┌─────────────────────────────────────────────────┐
│ MURIM - Pueblo sin Ley                          │
├─────────────────────────────────────────────────┤
│ TIPO: Zona de Exploración + PvP (Futuro)        │
│ NIVEL RECOMENDADO: 40-60                        │
│ DIFICULTAD: ⭐⭐⭐⭐ Alta                        │
│ RAREZA ENEMIGOS: Mundano, Refinado, Sublime,    │
│                  Supremo, Trascendente          │
│ ESTADO: 📝 Diseño (Fase 2)                      │
└─────────────────────────────────────────────────┘

DESCRIPCIÓN:
Pueblo donde se refugian los criminales más buscados.
Sin reglas, sin piedad.

ENEMIGOS EXCLUSIVOS (Diseño):
├─ Bandido Renegado (Supremo)
└─ Asesino de Elite (Trascendente)
```

#### **🧪 Machia - Laboratorio de Kimeras**
```
┌─────────────────────────────────────────────────┐
│ MACHIA - Zona de Laboratorio                    │
├─────────────────────────────────────────────────┤
│ TIPO: Zona de Exploración (Ciencia Loca)        │
│ NIVEL RECOMENDADO: 60-80                        │
│ DIFICULTAD: ⭐⭐⭐⭐⭐ Muy Alta                   │
│ RAREZA ENEMIGOS: ... + Celestial                │
│ ESTADO: 📝 Diseño (Fase 2)                      │
└─────────────────────────────────────────────────┘

DESCRIPCIÓN:
Antiguos laboratorios donde científicos locos crearon
aberraciones genéticas llamadas "Kimeras".

ENEMIGOS EXCLUSIVOS (Diseño):
├─ Kimera Alpha (Supremo)
└─ Kimera Experimental (Celestial)
```

#### **🏛️ Dungeon X (Mazmorra Infinita)**
```
┌─────────────────────────────────────────────────┐
│ DUNGEON X                                       │
├─────────────────────────────────────────────────┤
│ TIPO: Mazmorra por Pisos                        │
│ NIVEL RECOMENDADO: 80+                          │
│ DIFICULTAD: 💀 Extrema                          │
│ RAREZA ENEMIGOS: Escala con el piso             │
│ ESTADO: 📝 Diseño (Fase 2)                      │
└─────────────────────────────────────────────────┘

ESTRUCTURA:
Pisos 1-10:   Mundano/Refinado
Pisos 11-20:  Sublime/Supremo
Pisos 21-30:  Trascendente/Celestial
Pisos 31-40:  Dragón/Caos
Pisos 41+:    Cósmico + Bosses únicos
```

#### **🔥 Hellfire (Zone Caos)**
```
┌─────────────────────────────────────────────────┐
│ HELLFIRE                                        │
├─────────────────────────────────────────────────┤
│ TIPO: Zone Caos (End-Game)                      │
│ NIVEL RECOMENDADO: 90-100+                      │
│ DIFICULTAD: 💀💀💀 IMPOSIBLE                      │
│ RAREZA ENEMIGOS: Dragón, Caos, Cósmico          │
│ ESTADO: 📝 Diseño (Fase 2)                      │
└─────────────────────────────────────────────────┘

DESCRIPCIÓN:
Una dimensión de fuego y demonios. Solo los más fuertes
pueden sobrevivir aquí más de unos minutos.
```

---

## ⚠️ PROGRAMACIÓN - FASE ALFA:
═══════════════════════════════════════════════════════
MAYOI es la ÚNICA zona completamente programada en Fase Alfa.

✅ INCLUYE (Programado):
├─ 2 Enemigos exclusivos (Slime del Bosque, Lobo Sombrío)
├─ Sistema de encuentros funcional
├─ Drops de items
├─ Sistema de minería (nodos de piedra)
├─ Sistema de pesca (zonas de agua)
├─ Misiones activas
└─ Sistema de EXP y PassCoins

❌ RESTO DE ZONAS (Ryuuba, Llanuras, Murim, Machia, Dungeon X, Hellfire, Reinos):
├─ Solo estructura documental
├─ Enemigos diseñados pero NO programados
├─ NO hay encounters activos
└─ Se programarán en Fase 2+

🎯 RAZÓN: Probar sistema completo en 1 zona antes de replicar

---

## 🚶 SISTEMA DE VIAJE

### **Tipos de Exploración**

#### **1. Exploración Libre**
```
┌─────────────────────────────────────────────────┐
│ EXPLORACIÓN LIBRE                               │
├─────────────────────────────────────────────────┤
│ Exploras la zona actual sin moverte             │
│ Encuentros aleatorios                           │
│ Sin consumo de recursos de viaje                │
└─────────────────────────────────────────────────┘

MECÁNICA:
• Usas comando /explorar
• Seleccionas zona actual
• Sistema genera encuentro random:
  ├─ Enemigo (combate)
  ├─ Objeto (recolección)
  ├─ Nada (continuar)
  └─ Evento especial (raro)
```

#### **2. Exploración de Caminata**
```
┌─────────────────────────────────────────────────┐
│ EXPLORACIÓN DE CAMINATA                         │
├─────────────────────────────────────────────────┤
│ Viajas de una zona a otra                       │
│ Encuentros en el camino                         │
│ Sistema de distancia/metros                     │
└─────────────────────────────────────────────────┘

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

### **Semillas de Teletransporte**
```
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
```

---

## 🎮 SISTEMA DE EXPLORACIÓN

### **Comando: /explorar**
```
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

### **Probabilidades de Encuentros**

#### **En MAYOI (Ejemplo - Zona Programada)**
```
POOL DE ENCUENTROS:
• Enemigos de Mayoi (Slime, Lobo)
• Objetos de Mayoi
• Nodos de minería (15%)
• Zonas de pesca (5%)

PROBABILIDAD POR RAREZA (Ejemplo):
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

---

## ⛏️ SISTEMA NEKOTINA (Minería y Pesca)

> Ver documentación completa en: `sistema-nekotina.md`

### **Resumen**
Sistema de recolección pasiva durante exploración:
- ⛏️ **Minería**: Nodos aleatorios durante exploración
- 🎣 **Pesca**: Zonas de agua con bancos de peces
- 🛠️ **9 Rarezas de herramientas**: Mundano → Cósmico
- 🔨 **Crafteo progresivo**: Mejora tus herramientas
- 💰 **Generación de PassCoins**: Fuente alternativa de ingresos
- 🧱 **Materiales útiles**: Para crafteo y venta

### **Integración**
Durante exploración hay 15% probabilidad de nodo de minería y 10% de zona de pesca.

**Ver detalles completos en**: [`sistema-nekotina.md`](./sistema-nekotina.md)

---

## 📊 PROGRESIÓN Y RESTRICCIONES

### **Sistema de Rarezas de Enemigos**
```
RAREZAS (de menor a mayor):
1. ⚪ Mundano
2. 🟢 Refinado
3. 🔵 Sublime
4. 🟣 Supremo
5. ✨ Trascendente
6. 🟡 Celestial
7. 🐉 Dragón
8. 🌀 Caos
9. 🔴 Cósmico

DISTRIBUCIÓN POR ZONA (Sistema Acumulativo):
• Reinos: Mundano, Refinado
• Mayoi: Mundano, Refinado
• Ryuuba: Mundano, Refinado, Sublime
• Llanuras: Mundano, Refinado, Sublime, Supremo
• Murim: Mundano, Refinado, Sublime, Supremo, Trascendente
• Machia: ... + Celestial
• Dungeon X: Variable por piso (todas)
• Hellfire: Dragón, Caos, Cósmico (sin rarezas bajas)
```
