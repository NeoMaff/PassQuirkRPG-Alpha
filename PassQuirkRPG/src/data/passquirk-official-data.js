/**
 * 🌟 PassQuirk RPG - Datos Oficiales
 * Basado en la documentación oficial de GitBook
 * 
 * Este archivo contiene todos los datos oficiales del juego:
 * - PassQuirks y sus clases compatibles
 * - Quirks por clase con habilidades específicas
 * - Razas y sus bonificadores
 * - Enemigos por zona y rareza
 * - Objetos y equipamiento
 * - Sistema de rarezas
 */

const BASE_URL = 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images';

const ASSETS = {
    classes: {
        alma_naciente: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/classes/alma_naciente.png',
        ancestral: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/classes/ancestral.png',
        celestial: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/classes/celestial.png',
        fenix: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/classes/fenix.png',
        nigromante: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/classes/nigromante.png',
        shinobi: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/classes/shinobi.png',
        void: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/classes/void.png'
    },
    races: {
        elfos: `${BASE_URL}/races/elfos.png`,
        enanos: `${BASE_URL}/races/enanos.png`,
        humanos: `${BASE_URL}/races/humanos.png`,
        ogros: `${BASE_URL}/races/ogros.png`
    },
    icons: {
        attack: `${BASE_URL}/id_emoji_attack_basic.png`,
        classes: `${BASE_URL}/id_emoji_classes.png`,
        power_basic: `${BASE_URL}/id_emoji_power_basic.png`,
        power_special: `${BASE_URL}/id_emoji_power_special.png`,
        races: `${BASE_URL}/id_emoji_races.png`
    },
    stats: {
        alma_naciente: `${BASE_URL}/stats/alma_naciente.png`,
        ancestral: `${BASE_URL}/stats/ancestral.jpeg`,
        celestial: `${BASE_URL}/stats/celestial.jpeg`,
        fenix: `${BASE_URL}/stats/fenix.jpeg`,
        nigromante: `${BASE_URL}/stats/nigromante.jpeg`,
        shinobi: `${BASE_URL}/stats/shinobi.jpeg`,
        void: `${BASE_URL}/stats/void.jpeg`
    },
    powers: {
        celestial: {
            basic: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/celestial/basic.png',
            power: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/celestial/power.png',
            special: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/celestial/special.png'
        },
        fenix: {
            basic: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/fenix/basic.png',
            power: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/fenix/power.png',
            special: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/fenix/special.png'
        },
        void: {
            basic: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/void/basic.png',
            power: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/void/power.png',
            special: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/void/special.png'
        },
        shinobi: {
            basic: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/shinobi/basic.png',
            power: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/shinobi/power.png',
            special: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/shinobi/special.png'
        },
        alma_naciente: {
            basic: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/alma_naciente/basic.png',
            power: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/alma_naciente/power.png',
            special: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/alma_naciente/special.png'
        },
        nigromante: {
            basic: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/nigromante/basic.png',
            power: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/nigromante/power.png',
            special: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/nigromante/special.png'
        },
        ancestral: {
            basic: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/ancestral/basic.png',
            power: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/ancestral/power.png',
            special: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/skills/ancestral/special.png'
        }
    }
};

// 🧬 Razas del Juego
const RACES = {
    "HUMANOS": {
        name: "Humanos",
        emoji: "<:HumanosRazasPassQuirk:1443592330014883840>",
        description: "Versátiles y equilibrados. Se adaptan a cualquier situación.",
        image: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/races/humanos.png',
        multipliers: {
            hp: 1.10,
            mp: 1.10,
            attack: 1.10,
            defense: 1.0,
            speed: 1.05,
            magic_power: 1.10, // Multiplicador de daño mágico
            exp: 1.10
        },
        bonuses: ["+10% HP, Energía, ATK", "+10% Poder Mágico", "+5% Velocidad", "+10% EXP"]
    },
    "OGROS": {
        name: "Ogros",
        emoji: "<:ogros:1442155305491234947>",
        description: "Fuerza bruta y resistencia inigualable.",
        image: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/races/ogros.png',
        multipliers: {
            hp: 1.40,
            mp: 1.30,
            attack: 1.0,
            defense: 1.20,
            speed: 0.80,
            magic_power: 0.90,
            mp_regen_flat: 3 // +3 por turno
        },
        bonuses: ["+40% HP", "+30% Energía", "+20% Defensa", "+3 Regen Energía", "-20% Velocidad"]
    },
    "ELFOS": {
        name: "Elfos",
        emoji: "<:elfos:1442155303985610762>",
        description: "Ágiles y afines a la magia y la naturaleza.",
        image: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/races/elfos.png',
        multipliers: {
            hp: 0.75,
            mp: 1.0, // Base MP no cambia segun doc (solo regen)
            attack: 0.85, // -15% ATK Físico
            defense: 0.80,
            speed: 1.10,
            magic_power: 1.40,
            mp_regen: 1.25,
            cost_reduction: 0.80 // -20% coste
        },
        bonuses: ["+40% Poder Mágico", "+25% Regen Energía", "-20% Coste Habilidades", "+10% Velocidad", "-25% HP"]
    },
    "ENANOS": {
        name: "Enanos",
        emoji: "<:enanos:1442155302651822250>",
        description: "Resistentes y expertos en forja y tecnología.",
        image: 'https://ahsiiqqvbpgcljvkhlgq.supabase.co/storage/v1/object/public/images/races/enanos.png',
        multipliers: {
            hp: 0.80,
            mp: 1.0,
            attack: 1.15, // +15% ATK Físico
            defense: 1.0,
            speed: 1.30,
            magic_power: 0.85,
            crit_chance_flat: 20 // +20% prob
        },
        bonuses: ["+30% Velocidad", "+20% Prob. Crítico", "+15% ATK Físico", "+25% Daño Armas", "-20% HP"]
    }
};

// 🎮 Clases Base del Juego (Actualizadas con datos de GitBook y estadisticas.md)
const BASE_CLASSES = {
    "CELESTIAL": {
        emoji: "<:CelesitalClasePassQuirk:1441941085436776608>",
        description: "Soporte + DPS Mágico. Magia Sagrada + Área.",
        image: ASSETS.classes.celestial,
        role: "Soporte + DPS Mágico",
        style: "Magia Sagrada + Área",
        baseStats: { hp: 100, mp: 100, attack: 10, defense: 7, speed: 10 },
        statsImage: ASSETS.stats.celestial,
        abilities: {
            basic: { 
                name: "Rayo Sagrado", 
                emoji: "<:RayoSagrado:1441983138782904461>",
                damage: "150% ATK", 
                cost: 10, 
                target: "1 enemigo", 
                cooldown: 0, 
                image: ASSETS.powers.celestial.basic,
                crit: "300% ATK",
                unlockLevel: 5
            },
            power: { 
                name: "Destello Divino", 
                emoji: "<:DestelloDivino:1441983178557489173>",
                damage: "280% ATK", 
                effect: "Cura 15% HP máx aliado", 
                cost: 30, 
                target: "1 enemigo + 1 aliado", 
                cooldown: 2, 
                image: ASSETS.powers.celestial.power,
                crit: "560% ATK",
                unlockLevel: 10
            },
            special: { 
                name: "Juicio Celestial", 
                emoji: "<:JuicioCelestial:1441993545216032768>",
                damage: "450% ATK (Dividido)", 
                effect: "Purifica 1 buff enemigo", 
                cost: 70, 
                target: "Todos (Área)", 
                cooldown: 5, 
                image: ASSETS.powers.celestial.special,
                crit: "900% ATK",
                unlockLevel: 15
            }
        }
    },
    "FÉNIX": {
        emoji: "<:FnixClasePassQuirk:1441938882206765247>",
        description: "DPS + Supervivencia. Fuego + Regeneración.",
        image: ASSETS.classes.fenix,
        role: "DPS + Supervivencia",
        style: "Fuego + Regeneración",
        baseStats: { hp: 110, mp: 90, attack: 11, defense: 5, speed: 10 },
        statsImage: ASSETS.stats.fenix,
        abilities: {
            basic: { 
                name: "Garra Ígnea", 
                emoji: "<:Garragnea:1441983137679671438>",
                damage: "150% ATK", 
                cost: 12, 
                target: "1 enemigo", 
                cooldown: 0, 
                image: ASSETS.powers.fenix.basic,
                crit: "300% ATK",
                unlockLevel: 5
            },
            power: { 
                name: "Llamarada Vital", 
                emoji: "<:LlamaradaVital:1441983176481177620>",
                damage: "250% ATK", 
                effect: "Quema (50% ATK/turno x2) + Cura 10% HP máx (1 vez)", 
                cost: 30, 
                target: "1 enemigo", 
                cooldown: 3, 
                image: ASSETS.powers.fenix.power,
                crit: "500% ATK",
                unlockLevel: 10
            },
            special: { 
                name: "Renacimiento en Cenizas", 
                emoji: "<:RenacimientoenCenizas:1441993544272445543>",
                damage: "400% ATK", 
                effect: "Pasiva: Revive con 35% HP (1 vez)", 
                cost: 70, 
                target: "Todos (Área)", 
                cooldown: 6, 
                image: ASSETS.powers.fenix.special,
                crit: "800% ATK",
                unlockLevel: 15
            }
        }
    },
    "VOID": {
        emoji: "<:VoidClasePassQuirk:1441941115543752755>",
        description: "DPS Largo Alcance. Magia Espacial + Penetración.",
        image: ASSETS.classes.void,
        role: "DPS Largo Alcance",
        style: "Magia Espacial + Penetración",
        baseStats: { hp: 95, mp: 110, attack: 12, defense: 4, speed: 10 },
        statsImage: ASSETS.stats.void,
        abilities: {
            basic: { 
                name: "Pulso del Vacío", 
                emoji: "<:PulsodelVaco:1441983136316784642>",
                damage: "150% ATK", 
                cost: 10, 
                target: "1 enemigo", 
                cooldown: 0, 
                image: ASSETS.powers.void.basic,
                crit: "300% ATK",
                unlockLevel: 5
            },
            power: { 
                name: "Grieta Espacial", 
                emoji: "<:GrietaEspacial:1441983175399047228>",
                damage: "360% ATK (3 rayos x 120%)", 
                effect: "Ignora 15% DEF", 
                cost: 30, 
                target: "1-3 enemigos", 
                cooldown: 3, 
                image: ASSETS.powers.void.power,
                crit: "240% ATK por rayo",
                unlockLevel: 10
            },
            special: { 
                name: "Colapso Gravitatorio", 
                emoji: "<:ColapsoGravitatorio:1441993542775078974>",
                damage: "450% ATK", 
                effect: "-30% Velocidad x 2 turnos", 
                cost: 70, 
                target: "Todos (Área)", 
                cooldown: 6, 
                image: ASSETS.powers.void.special,
                crit: "900% ATK",
                unlockLevel: 15
            }
        }
    },
    "SHINOBI": {
        emoji: "<:ShinobiClasePassQuirk:1441941114771734630>",
        description: "Asesino + Movilidad. Cuerpo a Cuerpo + Magia.",
        image: ASSETS.classes.shinobi,
        role: "Asesino + Movilidad",
        style: "Cuerpo a Cuerpo + Magia",
        baseStats: { hp: 90, mp: 100, attack: 13, defense: 4, speed: 10 },
        statsImage: ASSETS.stats.shinobi,
        abilities: {
            basic: { 
                name: "Corte Sombra", 
                emoji: "<:CorteSombra:1441983134852710400>",
                damage: "150% ATK", 
                cost: 15, 
                target: "1 enemigo", 
                cooldown: 0, 
                image: ASSETS.powers.shinobi.basic,
                crit: "300% ATK (20% Prob Base)",
                unlockLevel: 5
            },
            power: { 
                name: "Sombra Ígnea", 
                emoji: "<:Sombragnea:1441983174132633610>",
                damage: "280% ATK", 
                effect: "Gana +20% Evasión vs próximo ataque", 
                cost: 30, 
                target: "1 enemigo", 
                cooldown: 2, 
                image: ASSETS.powers.shinobi.power,
                crit: "560% ATK (35% Prob)",
                unlockLevel: 10
            },
            special: { 
                name: "Espada Planetaria", 
                emoji: "<:EspadaPlanetaria:1441993540535193723>",
                damage: "500% ATK", 
                effect: "Atraviesa (100% / 60%)", 
                cost: 70, 
                target: "Línea (Max 2)", 
                cooldown: 5, 
                image: ASSETS.powers.shinobi.special,
                crit: "GARANTIZADO 1000% ATK",
                unlockLevel: 15
            }
        }
    },
    "ALMA NACIENTE": {
        emoji: "<:AlmanacienteClasePassQui:1441941113555521677>",
        description: "Bruiser + Ki. Ki + Magia Oscura.",
        image: ASSETS.classes.alma_naciente,
        role: "Bruiser + Ki",
        style: "Ki + Magia Oscura",
        baseStats: { hp: 105, mp: 95, attack: 11, defense: 6, speed: 10 },
        statsImage: ASSETS.stats.alma_naciente,
        abilities: {
            basic: { 
                name: "Puño Ki", 
                emoji: "<:PuoKi:1441983132898169034>",
                damage: "150% ATK", 
                cost: 12, 
                target: "1 enemigo", 
                cooldown: 0, 
                image: ASSETS.powers.alma_naciente.basic,
                crit: "300% ATK",
                unlockLevel: 5
            },
            power: { 
                name: "Energía de Ki", 
                emoji: "<:EnergadeKi:1441983172803035187>",
                damage: "360-480% ATK (3 golpes aleatorios)", 
                effect: "Recupera 15 Energía", 
                cost: 30, 
                target: "1 enemigo", 
                cooldown: 3, 
                image: ASSETS.powers.alma_naciente.power,
                crit: "Cada golpe x2",
                unlockLevel: 10
            },
            special: { 
                name: "Cataclismo Cósmico", 
                emoji: "<:CataclismoCosmica:1441993539209793637>",
                damage: "350% ATK Base", 
                effect: "+1.5% daño por 1% HP perdido", 
                cost: 70, 
                target: "1 enemigo", 
                cooldown: 6, 
                image: ASSETS.powers.alma_naciente.special,
                crit: "Base x2 + Escalado",
                unlockLevel: 15
            }
        }
    },
    "NIGROMANTE": {
        emoji: "<:NicromanteClasePassQuirk:1441941112301289523>",
        description: "Tanque + Invocación. Magia Negra + Sacrificio.",
        image: ASSETS.classes.nigromante,
        role: "Tanque + Invocación",
        style: "Magia Negra + Sacrificio",
        baseStats: { hp: 115, mp: 90, attack: 9, defense: 8, speed: 10 },
        statsImage: ASSETS.stats.nigromante,
        abilities: {
            basic: { 
                name: "Orbe Necrótico", 
                emoji: "<:OrbeNecrtico:1441983131870564483>",
                damage: "150% ATK", 
                cost: 10, 
                target: "1 enemigo", 
                cooldown: 0, 
                image: ASSETS.powers.nigromante.basic,
                crit: "300% ATK",
                unlockLevel: 5
            },
            power: { 
                name: "Magia Negra", 
                emoji: "<:MgiadelAnteceso:1441983171775434773>",
                damage: "300% ATK", 
                effect: "Lifesteal 12% + Stack Esencia", 
                cost: 30, 
                target: "1 enemigo", 
                cooldown: 2, 
                image: ASSETS.powers.nigromante.power,
                crit: "600% ATK",
                unlockLevel: 10
            },
            special: { 
                name: "Invocación de Muerte", 
                emoji: "<:InvocacindeMuerte:14419935383120773957>",
                damage: "550% ATK", 
                effect: "Ejecuta si HP < 25%. Coste: 35% HP + 3 Esencias", 
                cost: 70, 
                target: "1 enemigo", 
                cooldown: 8, 
                image: ASSETS.powers.nigromante.special,
                crit: "1100% ATK",
                unlockLevel: 15
            }
        }
    },
    "ANCESTRAL": {
        emoji: "<:AncestralClasePassQuirk:1441941110648995891>",
        description: "Counter Universal + Híbrido. Adaptativo + Magia Antigua.",
        image: ASSETS.classes.ancestral,
        role: "Counter Universal + Híbrido",
        style: "Adaptativo + Magia Antigua",
        selectable: false, // NO seleccionable en tutorial
        baseStats: { hp: 120, mp: 120, attack: 14, defense: 9, speed: 12 },
        statsImage: ASSETS.stats.ancestral,
        abilities: {
            basic: { 
                name: "Golpe Primordial", 
                emoji: "<:GolpePrimordial:1441983130633502860>",
                damage: "180% ATK", 
                cost: 10, 
                target: "1 enemigo", 
                cooldown: 0, 
                image: ASSETS.powers.ancestral.basic,
                crit: "360% ATK",
                unlockLevel: 5
            },
            power: { 
                name: "Magia del Antecesor", 
                emoji: "<:MgiadelAnteceso:1441983170550694081>",
                damage: "320% ATK", 
                effect: "Ignora 25% DEF + Counter Pasivo", 
                cost: 30, 
                target: "1 enemigo", 
                cooldown: 2, 
                image: ASSETS.powers.ancestral.power,
                crit: "640% ATK",
                unlockLevel: 10
            },
            special: { 
                name: "7 Caminos Antiguos", 
                emoji: "<:CaminosAntiguos:1441993537196658758>",
                damage: "Combo 7 Golpes", 
                effect: "Secuencia de efectos de todas las clases", 
                cost: 70, 
                target: "1 enemigo + Área", 
                cooldown: 7, 
                image: ASSETS.powers.ancestral.special,
                crit: "Variado",
                unlockLevel: 15
            }
        }
    }
};

// 🌟 PassQuirks (Actualizado)
const PASSQUIRKS = {
    fenix: { id: 1, name: "Fénix", description: "Potencia habilidades de regeneración y fuego.", compatibleClasses: ["FÉNIX", "CELESTIAL"], emoji: "🔥" },
    vendaval: { id: 2, name: "Vendaval", description: "Otorga velocidad extrema y control del viento.", compatibleClasses: ["SHINOBI", "DEMON"], emoji: "💨" }, // Demon placeholder class
    tierra: { id: 3, name: "Tierra", description: "Control masivo de rocas y tierra.", compatibleClasses: ["BERSERKER", "INMORTAL"], emoji: "🪨" }, // Berserker/Inmortal placeholders
    oscuridad: { id: 4, name: "Oscuridad", description: "Absorbe luz y permite invisibilidad temporal.", compatibleClasses: ["DEMON", "SHINOBI"], emoji: "🌑" },
    bestia: { id: 5, name: "Bestia", description: "Fuerza y resistencia física extremas.", compatibleClasses: ["BERSERKER", "DEMON"], emoji: "🐺" },
    trueno: { id: 6, name: "Trueno", description: "Control de rayos y velocidad mejorada.", compatibleClasses: ["SHINOBI", "FÉNIX"], emoji: "⚡" },
    dragon: { id: 7, name: "Dragón", description: "Fuerza y defensa dracónica.", compatibleClasses: ["INMORTAL", "FÉNIX"], emoji: "🐲" },
    agua: { id: 8, name: "Agua", description: "Control de agua y curación de aliados.", compatibleClasses: ["CELESTIAL", "INMORTAL"], emoji: "💧" },
    vacio: { id: 9, name: "Vacío", description: "Control gravitacional y manipulación del espacio.", compatibleClasses: ["DEMON", "CELESTIAL"], emoji: "🌌" },
    caos: { id: 10, name: "Caos", description: "Poder inestable capaz de causar destrucción masiva.", compatibleClasses: ["UNIVERSAL"], emoji: "🌀" },
    luz: { id: 11, name: "Luz", description: "Energía brillante y sagrada que potencia todas las habilidades.", compatibleClasses: ["UNIVERSAL"], emoji: "✨" }
};

const RARITIES = require('./rarities');

// ... (other constants)

// 🌟 Sistema de Rarezas
// Mapeo para compatibilidad con estructura antigua (Claves Capitalizadas)
const RARITY_SYSTEM = {};
Object.values(RARITIES).forEach(r => {
    RARITY_SYSTEM[r.name] = {
        color: r.color,
        dropRate: r.dropRate,
        power: r.multiplier,
        emoji: r.emoji,
        id: r.id
    };
});

// 👺 Enemigos por Zona (Actualizado según mapa-documentacion.md)
const ENEMIES_BY_ZONE = {
    bosque_inicial: {
        name: "Mayoi - Bosque Inicial",
        emoji: "🌲",
        level_range: "1-10",
        enemies: {
            slime_bosque: { name: "Slime del Bosque", level: "1-5", rarity: "Mundano", emoji: "💧" },
            lobo_sombrio: { name: "Lobo Sombrío", level: "5-10", rarity: "Refinado", emoji: "🐺" }
        }
    },
    reino_mirai: {
        name: "Reino Mirai (Humanos)",
        emoji: "👤",
        race: "HUMANOS",
        level_range: "1-99",
        enemies: {
            ladron_callejero: { name: "Ladrón Callejero", level: "1-99", rarity: "Mundano", emoji: "🗡️" },
            rata_mutante: { name: "Rata Mutante", level: "1-99", rarity: "Mundano", emoji: "🐀" },
            automata_defectuoso: { name: "Autómata Defectuoso", level: "1-99", rarity: "Refinado", emoji: "🤖" }
        }
    },
    reino_kyojin: {
        name: "Reino Kyojin (Ogros)",
        emoji: "🧌",
        race: "OGROS",
        level_range: "1-99",
        enemies: {
            elemental_fuego_menor: { name: "Elemental de Fuego Menor", level: "1-99", rarity: "Mundano", emoji: "🔥" },
            bestia_magma: { name: "Bestia de Magma", level: "1-99", rarity: "Refinado", emoji: "🌋" }
        }
    },
    reino_kogane: {
        name: "Reino Kogane (Enanos)",
        emoji: "🪓",
        race: "ENANOS",
        level_range: "1-99",
        enemies: {
            golem_piedra: { name: "Golem de Piedra", level: "1-99", rarity: "Mundano", emoji: "🪨" },
            insecto_gigante: { name: "Insecto Gigante", level: "1-99", rarity: "Refinado", emoji: "🐛" }
        }
    },
    reino_seirei: {
        name: "Reino Seirei (Elfos)",
        emoji: "🧝",
        race: "ELFOS",
        level_range: "1-99",
        enemies: {
            espiritu_bosque: { name: "Espíritu del Bosque", level: "1-99", rarity: "Mundano", emoji: "🍃" },
            guardian_ancestral: { name: "Guardián Ancestral", level: "1-99", rarity: "Refinado", emoji: "🛡️" }
        }
    },
    ryuuba: {
        name: "Ryuuba - Costa de los Dragones",
        emoji: "🏖️",
        level_range: "10-25",
        enemies: {
            cangrejo_arena: { name: "Cangrejo de Arena", level: "10-15", rarity: "Mundano", emoji: "🦀" },
            tiburon_costero: { name: "Tiburón Costero", level: "15-20", rarity: "Refinado", emoji: "🦈" },
            sirena_coral: { name: "Sirena de Coral", level: "20-25", rarity: "Sublime", emoji: "🧜‍♀️" }
        }
    },
    llanuras: {
        name: "Llanuras Centrales",
        emoji: "🌾",
        level_range: "25-40",
        enemies: {
            lobo_pradera: { name: "Lobo de Pradera", level: "25-30", rarity: "Mundano", emoji: "🐕" },
            bisonte_salvaje: { name: "Bisonte Salvaje", level: "30-40", rarity: "Sublime", emoji: "🦬" }
        }
    },
    murim: {
        name: "Murim - Refugio de Proscritos",
        emoji: "🏴‍☠️",
        level_range: "40-60",
        enemies: {
            bandido_renegado: { name: "Bandido Renegado", level: "40-50", rarity: "Supremo", emoji: "🥷" },
            asesino_elite: { name: "Asesino de Élite", level: "50-60", rarity: "Trascendente", emoji: "🗡️" }
        }
    },
    machia: {
        name: "Machia - Laboratorio",
        emoji: "🧪",
        level_range: "60-80",
        enemies: {
            kimera_alpha: { name: "Kimera Alpha", level: "60-70", rarity: "Supremo", emoji: "🧬" },
            kimera_experimental: { name: "Kimera Experimental", level: "70-80", rarity: "Celestial", emoji: "🧪" }
        }
    },
    dungeon_x: {
        name: "Dungeon X",
        emoji: "🏛️",
        level_range: "80+",
        enemies: {
            guardian_piso: { name: "Guardián de Piso", level: "80-99", rarity: "Supremo", emoji: "🗿" },
            sombra_eterna: { name: "Sombra Eterna", level: "90+", rarity: "Dragón", emoji: "👻" }
        }
    },
    hellfire: {
        name: "Hellfire",
        emoji: "🔥",
        level_range: "90-100+",
        enemies: {
            demonio_infernal: { name: "Demonio Infernal", level: "90-95", rarity: "Dragón", emoji: "👿" },
            avatar_caos: { name: "Avatar del Caos", level: "95-100", rarity: "Caos", emoji: "🌀" },
            devorador_mundos: { name: "Devorador de Mundos", level: "100+", rarity: "Cósmico", emoji: "🪐" }
        }
    }
};

module.exports = {
    PASSQUIRKS,
    BASE_CLASSES,
    RACES,
    ENEMIES_BY_ZONE,
    RARITY_SYSTEM,
    ASSETS
};
