# 🧬 Sistema Razas

## ✅ **CORRECCIÓN TOTAL - SISTEMA CLARIFICADO**

### 🔍 **ESTRUCTURA DEFINITIVA CONFIRMADA:**

```
╔═══════════════════════════════════════════════╗
║     SISTEMA CORRECTO DE STATS                 ║
╠═══════════════════════════════════════════════╣
║                                               ║
║ CLASES = Stats base del personaje             ║
║ ├─ HP                                         ║
║ ├─ Energía                                    ║
║ ├─ ATK                                        ║
║ ├─ DEF                                        ║
║ ├─ Velocidad                                  ║
║ └─ 3 Poderes (Básico, Poder, Especial)        ║
║                                               ║
║ RAZAS = Bonificaciones a las clases           ║
║ └─ Solo % de boost (no stats propias)         ║
║                                               ║
╚═══════════════════════════════════════════════╝
```

***

## 📊 **STATS BASE POR CLASE (YA HECHAS ANTERIORMENTE)**

```
╔═══════════════════════════════════════════════════════════════╗
║              ESTADÍSTICAS BASE POR CLASE (Nivel 1)            ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║ 🪽 CELESTIAL (Soporte/DPS Equilibrado)                        ║
║ ├─ HP: 100                                                    ║
║ ├─ Energía: 100                                               ║
║ ├─ ATK: 10                                                    ║
║ ├─ DEF: 7                                                     ║
║ ├─ Velocidad: 10                                              ║
║ └─ ROL: Soporte/DPS Mágico                                    ║
║                                                               ║
║ 🔥 FÉNIX (Tank DPS con Supervivencia)                         ║
║ ├─ HP: 110                                                    ║
║ ├─ Energía: 90                                                ║
║ ├─ ATK: 11                                                    ║
║ ├─ DEF: 5                                                     ║
║ ├─ Velocidad: 10                                              ║
║ └─ ROL: DPS con Supervivencia                                 ║
║                                                               ║
║ 🌌 VOID (Glass Cannon Mágico)                                 ║
║ ├─ HP: 95                                                     ║
║ ├─ Energía: 110                                               ║
║ ├─ ATK: 12                                                    ║
║ ├─ DEF: 4                                                     ║
║ ├─ Velocidad: 10                                              ║
║ └─ ROL: DPS de Largo Alcance                                  ║
║                                                               ║
║ ⚔️ SHINOBI (Asesino Crítico)                                  ║
║ ├─ HP: 90                                                     ║
║ ├─ Energía: 100                                               ║
║ ├─ ATK: 13                                                    ║
║ ├─ DEF: 4                                                     ║
║ ├─ Velocidad: 10                                              ║
║ └─ ROL: Asesino/Críticos                                      ║
║                                                               ║
║ 🌠 ALMA NACIENTE (Bruiser Equilibrado)                        ║
║ ├─ HP: 105                                                    ║
║ ├─ Energía: 95                                                ║
║ ├─ ATK: 11                                                    ║
║ ├─ DEF: 6                                                     ║
║ ├─ Velocidad: 10                                              ║
║ └─ ROL: Bruiser                                               ║
║                                                               ║
║ 💀 NIGROMANTE (Tank Invocador)                                ║
║ ├─ HP: 115                                                    ║
║ ├─ Energía: 90                                                ║
║ ├─ ATK: 9                                                     ║
║ ├─ DEF: 8                                                     ║
║ ├─ Velocidad: 10                                              ║
║ └─ ROL: Tank con Invocación                                   ║
║                                                               ║
║ 🌑 ANCESTRAL (Híbrido Superior - SECRETA)                     ║
║ ├─ HP: 120                                                    ║
║ ├─ Energía: 120                                               ║
║ ├─ ATK: 14                                                    ║
║ ├─ DEF: 9                                                     ║
║ ├─ Velocidad: 12                                              ║
║ └─ ROL: Counter Universal                                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

***

## 🧬 **SISTEMA DE RAZAS - DOCUMENTACIÓN CORREGIDA**

### 📋 **ÍNDICE**

1. Concepto General
2. Mecánicas del Sistema
3. Bonificaciones Raciales (4 Razas)
4. Sistema de Energía y Escalado

***

### 🎯 **CONCEPTO GENERAL**

#### **¿Qué son las Razas?**

Las **Razas** son bonificaciones aplicadas a las **Clases** en PassQuirk RPG. Cada raza tiene:

* **Bonificaciones porcentuales** que potencian las stats de tu clase
* **Identidad visual y narrativa** dentro del mundo
* **NO tienen stats propias** - solo modifican las stats de la clase

#### **Filosofía de Diseño:**

```
"Las razas amplifican la clase, no la reemplazan"

• Humanos = Boost equilibrado a todas las stats
• Ogros = Boost a HP y Energía
• Enanos = Boost a velocidad y críticos
• Elfos = Boost a poder mágico

IMPORTANTE: Las razas modifican la clase elegida.
```

***

### ⚙️ **MECÁNICAS DEL SISTEMA**

#### **1. Elección de Raza**

```
┌─────────────────────────────────────────────────┐
│ CUÁNDO: Durante la creación del personaje       │
│ CÓMO: Selector visual con descripción           │
│ CAMBIO: NO (solo con admin)                     │
│ COSTO: Gratis (decisión inicial)                │
└─────────────────────────────────────────────────┘
```

#### **2. Aplicación de Bonificaciones**

Las bonificaciones raciales se aplican **MULTIPLICATIVAMENTE** sobre las stats base de la **CLASE**:

```javascript
// EJEMPLO: Humano + Celestial
Clase: Celestial (100 HP base)
Raza: Humano (+10% HP)

HP_Final = HP_Clase × Bonificación_Racial
HP_Final = 100 × 1.10 = 110 HP
```

#### **3. Escalado por Nivel**

Las bonificaciones raciales **SE MANTIENEN** al subir de nivel:

```
NIVEL 1:
Celestial (100 HP) + Humano (+10%) = 110 HP

NIVEL 10 (multiplicador ×1.7):
Celestial (170 HP) + Humano (+10%) = 187 HP
```

#### **4. Interacción Completa**

```
STATS FINALES = (CLASE × RAZA) + EQUIPO + NIVEL

Ejemplo:
├─ Clase: Void
│  └─ HP: 95 | Energía: 110 | ATK: 12
├─ Raza: Elfo
│  └─ +40% Poder Mágico
├─ Equipo: Báculo Arcano
│  └─ +15% Poder Mágico
└─ Nivel 10: ×1.7

RESULTADO: Void con 95×1.7=161.5 HP + 155% Poder Mágico
```

***

### 📊 **BONIFICACIONES RACIALES (Solo Boosts)**

#### 👤 **HUMANO - Bonificaciones Equilibradas**

```
╔═══════════════════════════════════════════════╗
║         HUMANO - BOOST EQUILIBRADO            ║
╠═══════════════════════════════════════════════╣
║ • +10% HP                                     ║
║ • +10% Energía                                ║
║ • +10% ATK                                    ║
║ • +10% Poder Mágico                           ║
║ • +5% Velocidad                               ║
║ • +10% EXP ganada                             ║
║                                               ║
║ PASIVA: "Adaptación Humana"                   ║
║ └─ +2% todos los stats cada 10 niveles        ║
╚═══════════════════════════════════════════════╝

EJEMPLO APLICADO:
Humano + Celestial (Nivel 1):
├─ HP: 100 × 1.10 = 110
├─ Energía: 100 × 1.10 = 110
├─ ATK: 10 × 1.10 = 11
├─ DEF: 7 (sin bonus)
└─ Velocidad: 10 × 1.05 = 10.5
```

***

#### 🧌 **OGRO - Bonificaciones Tank/Energía**

```
╔═══════════════════════════════════════════════╗
║       OGRO - BOOST TANK ENERGÉTICO            ║
╠═══════════════════════════════════════════════╣
║ • +40% HP                                     ║
║ • +30% Energía                                ║
║ • +20% DEF                                    ║
║ • +3 Regeneración energía/turno               ║
║   (13 en lugar de 10)                         ║
║ • -20% Velocidad                              ║
║ • -10% Poder Mágico                           ║
║                                               ║
║ PASIVA: "Regeneración Colosal"                ║
║ └─ +3 energía/turno                           ║
║ └─ +15% resistencia a debuffs                 ║
╚═══════════════════════════════════════════════╝

EJEMPLO APLICADO:
Ogro + Fénix (Nivel 1):
├─ HP: 110 × 1.40 = 154
├─ Energía: 90 × 1.30 = 117
├─ ATK: 11 (sin bonus)
├─ DEF: 5 × 1.20 = 6
└─ Velocidad: 10 × 0.80 = 8
```

***

#### 🪓 **ENANO - Bonificaciones Crítico/Velocidad**

```
╔═══════════════════════════════════════════════╗
║      ENANO - BOOST CRÍTICO/VELOCIDAD          ║
╠═══════════════════════════════════════════════╣
║ • +25% Daño con ARMAS equipadas               ║
║ • +30% Velocidad                              ║
║ • +20% Probabilidad de crítico                ║
║ • +15% ATK físico                             ║
║ • -20% HP                                     ║
║ • -15% Poder Mágico                           ║
║                                               ║
║ PASIVA: "Golpe Preciso"                       ║
║ └─ Críticos ignoran 20% DEF enemiga           ║
╚═══════════════════════════════════════════════╝

EJEMPLO APLICADO:
Enano + Shinobi (Nivel 1):
├─ HP: 90 × 0.80 = 72
├─ Energía: 100 (sin bonus)
├─ ATK: 13 × 1.15 = 14.95
├─ DEF: 4 (sin bonus)
├─ Velocidad: 10 × 1.30 = 13
└─ Prob. Crítico: 10% + 20% = 30%
```

***

#### 🧝 **ELFO - Bonificaciones Mágicas**

```
╔═══════════════════════════════════════════════╗
║         ELFO - BOOST MÁGICO PURO              ║
╠═══════════════════════════════════════════════╣
║ • +40% Poder Mágico                           ║
║ • +25% Regeneración energía                   ║
║   (12.5/turno en lugar de 10)                 ║
║ • -20% Coste energía de habilidades           ║
║ • +15% Alcance habilidades de área            ║
║ • +10% Velocidad                              ║
║ • -25% HP                                     ║
║ • -20% DEF                                    ║
║ • -15% ATK físico                             ║
║                                               ║
║ PASIVA: "Conexión Arcana"                     ║
║ └─ +2% Poder Mágico por habilidad usada       ║
║ └─ Máximo: 10 stacks (+20%)                   ║
║ └─ Duración: 5 turnos por stack               ║
╚═══════════════════════════════════════════════╝

EJEMPLO APLICADO:
Elfo + Void (Nivel 1):
├─ HP: 95 × 0.75 = 71.25
├─ Energía: 110 (sin bonus base)
├─ ATK: 12 × 0.85 = 10.2
├─ DEF: 4 × 0.80 = 3.2
├─ Velocidad: 10 × 1.10 = 11
└─ Poder Mágico: 140% (base 100% + 40%)
```

***

### 📊 **TABLA COMPARATIVA DE BONIFICACIONES**

```
┌──────────┬────────┬─────────┬───────┬───────┬──────────┬────────────┐
│ Raza     │ HP     │ Energía │ ATK   │ DEF   │ Velocidad│ Poder Mág. │
├──────────┼────────┼─────────┼───────┼───────┼──────────┼────────────┤
│ Humano   │ +10%   │ +10%    │ +10%  │ 0%    │ +5%      │ +10%       │
│ Ogro     │ +40%   │ +30%    │ 0%    │ +20%  │ -20%     │ -10%       │
│ Enano    │ -20%   │ 0%      │ +15%  │ 0%    │ +30%     │ -15%       │
│ Elfo     │ -25%   │ 0%      │ -15%  │ -20%  │ +10%     │ +40%       │
└──────────┴────────┴─────────┴───────┴───────┴──────────┴────────────┘
```

***

### ⚙️ **SISTEMA DE ENERGÍA (POR CLASE)**

Cada clase tiene su propio sistema de energía:

```
╔═══════════════════════════════════════════════╗
║        SISTEMA DE ENERGÍA UNIVERSAL           ║
╠═══════════════════════════════════════════════╣
║ Regeneración Base: +10 energía/turno          ║
║ Ataque Básico: 10-15 energía                  ║
║ Poder Básico: 30 energía                      ║
║ Poder Especial: 70 energía                    ║
╚═══════════════════════════════════════════════╝
```

***

### 📈 **SISTEMA DE ESCALADO (UNIVERSAL)**

```
╔═══════════════════════════════════════════════╗
║           ESCALADO POR NIVEL                  ║
╠═══════════════════════════════════════════════╣
║ Niveles 1-9:   Multiplicador ×1.15 por nivel  ║
║ Nivel 10:      Multiplicador ×1.7 (salto)     ║
║ Niveles 11-19: Multiplicador ×1.15 por nivel  ║
║ Nivel 20:      Multiplicador ×1.7             ║
║ (Patrón continúa cada 10 niveles)             ║
╚═══════════════════════════════════════════════╝

EXPERIENCIA:
Nivel 1→2:  100 EXP
Nivel 2→3:  150 EXP
Formula: EXP_anterior × 1.3
Nivel 9→10: 850 EXP
```

***

### ✅ **RESUMEN EJECUTIVO**

```
╔═══════════════════════════════════════════════╗
║    SISTEMA DE RAZAS - PUNTOS CLAVE            ║
╠═══════════════════════════════════════════════╣
║ • 4 Razas con bonificaciones % a clases       ║
║ • NO tienen stats propias                     ║
║ • Modifican multiplicativamente la clase      ║
║ • Cada raza tiene 1 pasiva única              ║
║ • Balance: todas viables                      ║
╚═══════════════════════════════════════════════╝
```

***
