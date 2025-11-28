# 🛠️ SISTEMA NEKOTINA - Minería y Pesca

> **Sistema de recolección pasiva inspirado en Nekotina Discord Bot**  
> **Versión**: 1.0 - Alfa  
> **Fecha**: 2025-11-28

---

## 📋 ÍNDICE
1. [Concepto General](#concepto-general)
2. [Sistema de Minería](#sistema-de-minería)
3. [Sistema de Pesca](#sistema-de-pesca)
4. [Herramientas](#herramientas)
5. [Materiales](#materiales)
6. [Crafteo y Mejora](#crafteo-y-mejora)
7. [Integración con Exploración](#integración-con-exploración)

---

## 🎯 CONCEPTO GENERAL

### **¿Qué es el Sistema Nekotina?**
Sistema de **minería y pesca** que permite a los jugadores recolectar materiales y PassCoins de forma activa durante la exploración.

### **Inspiración: Nekotina Bot**
- Comando `/mine` para minar
- Comando `/fish` para pescar
- Picos y cañas con **rarezas progresivas**
- **Crafteo** de herr amientas mejores
- **Durabilidad** y reparación
- **Zonas específicas** con requisitos de herramienta

### **Implementación en PassQuirkRPG**
```
DURANTE EXPLORACIÓN:
├─ Aparecen nodos de minería (piedras)
├─ Aparecen zonas de pesca (agua)
├─ Usas tu pico/caña actual
├─ Obtienes materiales + PassCoins
└─ Las herramientas se desgastan
```

---

## ⛏️ SISTEMA DE MINERÍA

### **Mecánica**
```
1. Estás explorando una zona
2. Aparece: "¡Has encontrado una Piedra de Hierro (Refinado)!"
3. Opciones:
   ├─ Usar Pico (si tienes el adecuado)
   └─ Ignorar (pierdes la oportunidad)
4. Al usar pico:
   ├─ Obtienes materiales
   ├─ Obtienes PassCoins
   └─ Pico pierde durabilidad
```

### **Nodos de Minería por Rareza**
```
┌─────────────────────────────────────────────────┐
│ NODOS DE MINERÍA                                │
├─────────────────────────────────────────────────┤
│ Rareza Mundano:                                 │
│ • Piedra Común                                  │
│ • Roca de Granito                               │
│                                                 │
│ Rareza Refinado:                                │
│ • Piedra de Hierro                              │
│ • Mineral de Cobre                              │
│                                                 │
│ Rareza Sublime:                                 │
│ • Cristal Azul                                  │
│ • Mineral de Plata                              │
│                                                 │
│ Rareza Supremo:                                 │
│ • Gema Roja                                     │
│ • Mineral de Oro                                │
│                                                 │
│ Rareza Trascendente:                            │
│ • Esencia de Eternidad                          │
│ • Mineral Trascendente                          │
│                                                 │
│ Rareza Celestial:                               │
│ • Cristal Divino                                │
│ • Mineral Celestial                             │
│                                                 │
│ Rareza Dragón:                                  │
│ • Escama de Dragón Petrificada                  │
│ • Mineral Dracónico                             │
│                                                 │
│ Rareza Caos:                                    │
│ • Fragmento del Caos                            │
│ • Mineral Corrupto                              │
│                                                 │
│ Rareza Cósmico:                                 │
│ • Fragmento Estelar                             │
│ • Mineral Cósmico                               │
└─────────────────────────────────────────────────┘
```

### **Recompensas por Rareza**
```
┌──────────────┬─────────────┬──────────────────┐
│ Rareza       │ PassCoins   │ Materiales       │
├──────────────┼─────────────┼──────────────────┤
│ Mundano      │ 5-10        │ 1-2              │
│ Refinado     │ 15-25       │ 2-3              │
│ Sublime      │ 35-50       │ 3-4              │
│ Supremo      │ 60-90       │ 4-5              │
│ Trascendente │ 100-150     │ 5-7              │
│ Celestial    │ 180-250     │ 7-10             │
│  Dragón       │ 300-450     │ 10-15            │
│ Caos         │ 500-750     │ 15-20            │
│ Cósmico      │ 800-1200    │ 20-30            │
└──────────────┴─────────────┴──────────────────┘
```

---

## 🎣 SISTEMA DE PESCA

### **Mecánica**
```
1. Estás explorando una zona con agua
2. Aparece: "¡Hay un banco de peces cerca!"
3. Opciones:
   ├─ Usar Caña (si tienes)
   └─ Ignorar
4. Al usar caña:
   ├─ Obtienes peces (consumibles)
   ├─ Obtienes materiales acuáticos
   ├─ Obtienes PassCoins
   └─ Caña pierde durabilidad
```

### **Peces por Rareza**
```
┌─────────────────────────────────────────────────┐
│ PECES Y CRIATURAS ACUÁTICAS                     │
├─────────────────────────────────────────────────┤
│ Rareza Mundano:                                 │
│ • Pez Común                                     │
│ • Carpa Gris                                    │
│                                                 │
│ Rareza Refinado:                                │
│ • Trucha Plateada                               │
│ • Bagre Azul                                    │
│                                                 │
│ Rareza Sublime:                                 │
│ • Salmón Dorado                                 │
│ • Atún Brillante                                │
│                                                 │
│ Rareza Supremo:                                 │
│ • Pez Espada Místico                            │
│ • Manta Raya Cristalina                         │
│                                                 │
│ Rareza Celestial:                               │
│ • Pez Ángel Divino                              │
│ • Delfín Celestial                              │
│                                                 │
│ Rareza Cósmico:                                 │
│ • Anguila Estelar                               │
│ • Medusa Cósmica                                │
│                                                 │
│ Rareza Dragón:                                  │
│ • Serpiente Marina Dracónica                    │
│ • Leviatán Juvenil                              │
│                                                 │
│ Rareza Trascendente:                            │
│ • Kraken Eterno                                 │
│ • Ballena del Fin del Mundo                     │
└─────────────────────────────────────────────────┘
```

### **Recompensas por Rareza**
```
┌──────────────┬─────────────┬──────────────────┬──────────────┐
│ Rareza       │ PassCoins   │ Peces (comida)   │ Materiales   │
├──────────────┼─────────────┼──────────────────┼──────────────┤
│ Mundano      │ 5-10        │ 1-2              │ 1            │
│ Refinado     │ 15-25       │ 2-3              │ 1-2          │
│ Sublime      │ 35-50       │ 3-4              │ 2-3          │
│ Supremo      │ 60-90       │ 4-5              │ 3-4          │
│ Celestial    │ 100-150     │ 5-7              │ 4-6          │
│ Cósmico      │ 180-250     │ 7-10             │ 6-8          │
│ Dragón       │ 300-450     │ 10-15            │ 8-12         │
│ Trascendente │ 500-750     │ 15-20            │ 12-18        │
└──────────────┴─────────────┴──────────────────┴──────────────┘
```

---

## 🛠️ HERRAMIENTAS

### **⛏️ PICOS (9 Rarezas)**
```
┌─────────────────────────────────────────────────────────────┐
│ PICOS DE MINERÍA                                            │
├──────────────┬───────────┬──────────┬────────────┬──────────┤
│ Nombre       │ Rareza    │ Dura.    │ Coste      │ Obtención│
├──────────────┼───────────┼──────────┼────────────┼──────────┤
│ Pico Rústico │ Mundano   │ 50 usos  │ 100 PC     │ Tienda   │
│              │           │          │            │          │
│ Pico de      │ Refinado  │ 80 usos  │ Crafteo    │ Craft +  │
│ Hierro       │           │          │            │ Materia  │
│              │           │          │            │          │
│ Pico de      │ Sublime   │ 120 usos │ Crafteo    │ Craft +  │
│ Cristal      │           │          │            │ Materia  │
│              │           │          │            │          │
│ Pico de Oro  │ Supremo   │ 180 usos │ Crafteo    │ Craft +  │
│              │           │          │            │ Materia  │
│              │           │          │            │          │
│ Pico Eterno  │ Trascen-  │ 250 usos │ Crafteo    │ Craft +  │
│              │ dente     │          │            │ Materia  │
│              │           │          │            │          │
│ Pico Divino  │ Celestial │ 350 usos │ Crafteo    │ Craft +  │
│              │           │          │            │ Materia  │
│              │           │          │            │          │
│ Pico Dracó-  │ Dragón    │ 500 usos │ Crafteo    │ Craft +  │
│ nico         │           │          │            │ Boss     │
│              │           │          │            │          │
│ Pico Caótico │ Caos      │ 750 usos │ Crafteo    │ Craft +  │
│              │           │          │            │ Boss     │
│              │           │          │            │          │
│ Pico Estelar │ Cósmico   │ 1000 usos│ Crafteo    │ Craft +  │
│              │           │          │            │ Boss     │
└──────────────┴───────────┴──────────┴────────────┴──────────┘
```

### **🎣 CAÑAS (9 Rarezas)**
```
┌─────────────────────────────────────────────────────────────┐
│ CAÑAS DE PESCA                                              │
├──────────────┬───────────┬──────────┬────────────┬──────────┤
│ Nombre       │ Rareza    │ Dura.    │ Coste      │ Obtención│
├──────────────┼───────────┼──────────┼────────────┼──────────┤
│ Caña Simple  │ Mundano   │ 50 usos  │ 100 PC     │ Tienda   │
│              │           │          │            │          │
│ Caña de      │ Refinado  │ 80 usos  │ Crafteo    │ Craft +  │
│ Bambú        │           │          │            │ Materia  │
│              │           │          │            │          │
│ Caña de      │ Sublime   │ 120 usos │ Crafteo    │ Craft +  │
│ Cristal      │           │          │            │ Materia  │
│ Azul         │           │          │            │          │
│              │           │          │            │          │
│ Caña Dorada  │ Supremo   │ 180 usos │ Crafteo    │ Craft +  │
│              │           │          │            │ Materia  │
│              │           │          │            │          │
│ Caña Eterna  │ Trascen-  │ 250 usos │ Crafteo    │ Craft +  │
│              │ dente     │          │            │ Materia  │
│              │           │          │            │          │
│ Caña Divina  │ Celestial │ 350 usos │ Crafteo    │ Craft +  │
│              │           │          │            │ Materia  │
│              │           │          │            │          │
│ Caña Dracó-  │ Dragón    │ 500 usos │ Crafteo    │ Craft +  │
│ nica         │           │          │            │ Boss     │
│              │           │          │            │          │
│ Caña Caótica │ Caos      │ 750 usos │ Crafteo    │ Craft +  │
│              │           │          │            │ Boss     │
│              │           │          │            │          │
│ Caña Estelar │ Cósmico   │ 1000 usos│ Crafteo    │ Craft +  │
│              │           │          │            │ Boss     │
└──────────────┴───────────┴──────────┴────────────┴──────────┘
```

---

## 🧱 MATERIALES

### **Materiales de Minería**
```
MATERIAL POR RAREZA:
Mundano:      Fragmento de Piedra
Refinado:     Lingote de Hierro
Sublime:      Cristal Pulido
Supremo:      Pepita de Oro
Trascendente: Esencia Eterna
Celestial:    Polvo Divino
Dragón:       Escama Dracónica
Caos:         Núcleo del Caos
Cósmico:      Fragmento Estelar

USOS:
• Craftear/reparar picos
• Mejorar equipo
• Vender por PassCoins
• Misiones de crafteo
```

### **Materiales de Pesca**
```
MATERIAL POR RAREZA:
Mundano:      Escama Común
Refinado:     Perla Pequeña
Sublime:      Perla Brillante
Supremo:      Perla Dorada
Trascendente: Lágrima del Océano Eterno
Celestial:    Esencia Marina
Dragón:       Colmillo de Leviatán
Caos:         Núcleo Abisal
Cósmico:      Fragmento Oceánico

USOS:
• Craftear/reparar cañas
• Crear consumibles  de curación
• Vender por PassCoins
• Misiones de crafteo
```

---

## 🔨 CRAFTEO Y MEJORA

### **Sistema de Crafteo**
```
REQUISITOS PARA CRAFTEAR:
1. Materiales necesarios (de la rareza correspondiente)
2. PassCoins (coste de fabricación)
3. Nivel mínimo del jugador
4. Desbloqueo de receta (algunas requieren quest)

EJEMPLO - Pico de Hierro (Refinado):
├─ 10x Lingote de Hierro
├─ 500 PassCoins
├─ Nivel 10
└─ Ningún requisito especial
```

### **Sistema de Reparación**
```
CÓMO REPARAR:
1. Herramienta debe tener <50% durabilidad
2. Usas materiales de la MISMA rareza
3. Coste = 50% del coste original de crafteo

EJEMPLO - Reparar Pico de Hierro:
├─ 5x Lingote de Hierro (50% de 10)
└─ 250 PassCoins (50% de 500)

RESULTADO:
• Herramienta vuelve a 100% durabilidad
```

### **Recetas de Crafteo**
```
PICO MUNDANO (Inicial):
Se compra en tienda, NO se craftea

PICO REFINADO:
├─ 10x Lingote de Hierro
├─ 500 PassCoins
└─ Nivel 10

PICO SUBLIME:
├─ 1x Pico Refinado
├─ 15x Cristal Pulido
├─ 2000 PassCoins
└─ Nivel 25

PICO SUPREMO:
├─ 1x Pico Sublime
├─ 20x Pepita de Oro
├─ 5000 PassCoins
└─ Nivel 40

PICO CELESTIAL:
├─ 1x Pico Supremo
├─ 25x Polvo Divino
├─ 15000 PassCoins
└─ Nivel 60

...y así sucesivamente hasta Trascendente
```

---

## 🔗 INTEGRACIÓN CON EXPLORACIÓN

### **Durante Exploración Libre**
```
SISTEMA:
1. Usuario usa /explorar
2. Sistema genera encuentro
3. Posibles resultados:
   ├─ Enemigo (40%)
   ├─ Objeto/ítem (25%)
   ├─ Nodo de minería (15%)  ⬅️ NUEVO
   ├─ Zona de pesca (10%)     ⬅️ NUEVO
   └─ Nada (10%)
```

### **Probabilidad de Nodos por Zona**
```
┌──────────────────┬────────────┬──────────┐
│ Zona             │ Minería    │ Pesca    │
├──────────────────┼────────────┼──────────┤
│ Mayoi            │ 15%        │ 5%       │
│ Ryuuba           │ 5%         │ 25%      │
│ Llanuras         │ 20%        │ 2%       │
│ Murim            │ 10%        │ 8%       │
│ Machia           │ 12%        │ 3%       │
│ Dungeon X        │ 25%        │ 0%       │
│ Hellfire         │ 30%        │ 0%       │
│ Reinos           │ 8%         │ 8%       │
└──────────────────┴────────────┴──────────┘
```

### **Ejemplo de Encuentro**
```
> Usas /explorar en Mayoi

Bot:
┌───────────────────────────────────────┐
│ 🌲 Explorando: Mayoi                  │
│ 📍 Ubicación: Bosque Central          │
│ 🕐 Hora local: 14:35                  │
│ 🌍 Hora global: Día 5, Tarde          │
│ ☀️ Clima: Soleado                     │
├───────────────────────────────────────┤
│ ¡Has encontrado algo!                 │
│                                       │
│ ⛏️ **PIEDRA DE HIERRO (Refinado)**    │
│                                       │
│ Tu pico actual: Pico Rústico (Mundano)│
│ Durabilidad: 35/50 usos               │
│                                       │
│ ⚠️ Tu pico NO puede minar esto        │
│ Necesitas: Pico Refinado o superior   │
└───────────────────────────────────────┘

[Botón: Ignorar] [Botón: Volver]
```

---

## 📊 RESUMEN EJECUTIVO

**Sistema Nekotina** añade una capa de **farming pasivo** al juego:

- ⛏️ **Minería**: Nodos aleatorios durante exploración
- 🎣 **Pesca**: Zonas de agua con bancos de peces
- 🛠️ **9 Rarezas de herramientas**: Mundano → Cósmico
- 🔨 **Crafteo progresivo**: Mejora tus herramientas
- 💰 **Generación de PassCoins**: Fuente alternativa de ingresos
- 🧱 **Materiales útiles**: Para crafteo y venta

**Beneficios**:
✅ Contenido adicional sin afectar combate
✅ Sistema económico más rico
✅ Progresión paralela (picos/cañas)
✅ Recompensa la exploración constante

---

**Última actualización**: 2025-11-28  
**Versión**: 1.0 - Alfa  
**Estado**: Listo para programación
