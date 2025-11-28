/**
 * ⚔️ Base de datos de Habilidades y Poderes
 * Unificación de stats (estadisticas.md) y visuales (emojisid.md)
 */

const ABILITIES = {
    // ==========================================
    // CLASE: CELESTIAL
    // ==========================================
    celestial: {
        basic: {
            id: 'celestial_basic',
            name: 'Rayo Sagrado',
            type: 'physical_attack',
            emoji: '<:RayoSagradoAtaqueFsicoC:1441983138782904461>',
            description: 'Dispara un rayo de luz sagrada al enemigo.',
            damageMult: 1.5, // 150% ATK
            energyCost: 10,
            unlockLevel: 1
        },
        power: {
            id: 'celestial_power',
            name: 'Destello Divino',
            type: 'physical_power',
            emoji: '<:DestelloDivinoPoderFsic:1441983178557489173>',
            description: 'Un destello que daña y cura ligeramente a un aliado.',
            damageMult: 2.8, // 280% ATK
            energyCost: 30,
            unlockLevel: 5
        },
        special: {
            id: 'celestial_special',
            name: 'Juicio Celestial',
            type: 'special_power',
            emoji: '<:JuicioCelestialPoderEspeci:1441993545216032768>',
            description: 'Invoca el juicio final sobre todos los enemigos.',
            damageMult: 4.5, // 450% ATK
            energyCost: 70,
            unlockLevel: 15 // Asumido nivel superior
        }
    },

    // ==========================================
    // CLASE: FÉNIX
    // ==========================================
    fenix: {
        basic: {
            id: 'fenix_basic',
            name: 'Garra Ígnea',
            type: 'physical_attack',
            emoji: '<:GarragneaAtaqueFsicoFnix:1441983137679671438>',
            description: 'Un zarpazo envuelto en llamas.',
            damageMult: 1.5,
            energyCost: 12,
            unlockLevel: 1
        },
        power: {
            id: 'fenix_power',
            name: 'Llamarada Vital',
            type: 'physical_power',
            emoji: '<:LlamaradaVitalPoderFsico:1441983176481177620>',
            description: 'Quema al enemigo y regenera salud.',
            damageMult: 2.5,
            energyCost: 30,
            unlockLevel: 5
        },
        special: {
            id: 'fenix_special',
            name: 'Renacimiento en Cenizas',
            type: 'special_power',
            emoji: '<:RenacimientoenCenizasPo:1441993544272445543>',
            description: 'Explosión de fuego en área.',
            damageMult: 4.0,
            energyCost: 70,
            unlockLevel: 15
        }
    },

    // ==========================================
    // CLASE: VOID
    // ==========================================
    void: {
        basic: {
            id: 'void_basic',
            name: 'Pulso del Vacío',
            type: 'physical_attack',
            emoji: '<:PulsodelVacoAtaqueBsicoV:1441983136316784642>',
            description: 'Onda de energía oscura.',
            damageMult: 1.5,
            energyCost: 10,
            unlockLevel: 1
        },
        power: {
            id: 'void_power',
            name: 'Grieta Espacial',
            type: 'physical_power',
            emoji: '<:GrietaEspacialPoderFsicoV:1441983175399047228>',
            description: 'Abre grietas que disparan rayos aleatorios.',
            damageMult: 3.6, // 360% total
            energyCost: 30,
            unlockLevel: 5
        },
        special: {
            id: 'void_special',
            name: 'Colapso Gravitatorio',
            type: 'special_power',
            emoji: '<:ColapsoGravitatorioPoderE:1441993542775078974>',
            description: 'Aplasta a los enemigos con gravedad.',
            damageMult: 4.5,
            energyCost: 70,
            unlockLevel: 15
        }
    },

    // ==========================================
    // CLASE: SHINOBI
    // ==========================================
    shinobi: {
        basic: {
            id: 'shinobi_basic',
            name: 'Corte Sombra',
            type: 'physical_attack',
            emoji: '<:CorteSombraAtaqueBsicoS:1441983134852710400>',
            description: 'Corte rápido desde las sombras.',
            damageMult: 1.5,
            energyCost: 15,
            unlockLevel: 1
        },
        power: {
            id: 'shinobi_power',
            name: 'Sombra Ígnea',
            type: 'physical_power',
            emoji: '<:SombragneaPoderFsicoShi:1441983174132633610>',
            description: 'Ataque sigiloso que aumenta la evasión.',
            damageMult: 2.8,
            energyCost: 30,
            unlockLevel: 5
        },
        special: {
            id: 'shinobi_special',
            name: 'Espada Planetaria',
            type: 'special_power',
            emoji: '<:EspadaPlanetariaPoderEsp:1441993540535193723>',
            description: 'Corte dimensional que atraviesa enemigos.',
            damageMult: 5.0,
            energyCost: 70,
            unlockLevel: 15
        }
    },

    // ==========================================
    // CLASE: ALMA NACIENTE
    // ==========================================
    alma_naciente: {
        basic: {
            id: 'alma_basic',
            name: 'Puño Ki',
            type: 'physical_attack',
            emoji: '<:PuoKiAtaqueBsicoAlmaNa:1441983132898169034>',
            description: 'Golpe concentrado de energía vital.',
            damageMult: 1.5,
            energyCost: 12,
            unlockLevel: 1
        },
        power: {
            id: 'alma_power',
            name: 'Energía de Ki',
            type: 'physical_power',
            emoji: '<:EnergadeKiPoderFsicoAlm:1441983172803035187>',
            description: 'Ráfaga de 3 golpes aleatorios.',
            damageMult: 4.0, // Promedio
            energyCost: 30,
            unlockLevel: 5
        },
        special: {
            id: 'alma_special',
            name: 'Cataclismo Cósmico',
            type: 'special_power',
            emoji: '<:CataclismoCosmicaPoderEs:1441993539209793637>',
            description: 'Explosión que escala con HP perdido.',
            damageMult: 3.5, // Base
            energyCost: 70,
            unlockLevel: 15
        }
    },

    // ==========================================
    // CLASE: NIGROMANTE
    // ==========================================
    nigromante: {
        basic: {
            id: 'nigromante_basic',
            name: 'Orbe Necrótico',
            type: 'physical_attack',
            emoji: '<:OrbeNecrticoAtaqueBsico:1441983131870564483>',
            description: 'Proyectil de energía muerta.',
            damageMult: 1.5,
            energyCost: 10,
            unlockLevel: 1
        },
        power: {
            id: 'nigromante_power',
            name: 'Magia Negra', // No tengo emoji especifico en lista de Poder Fisico, uso generico o repito logica?
            // UPDATE: El usuario no paso emoji de Poder Basico Nigromante en la lista L24-30,
            // pero sí paso "InvocacindeMuerte" en Especial.
            // Usaré un placeholder o el de ataque básico temporalmente si no está.
            // Revisando lista... NO ESTÁ en L24-30.
            // Usaré uno genérico oscuro.
            type: 'physical_power',
            emoji: '💀', 
            description: 'Daña y roba vida.',
            damageMult: 3.0,
            energyCost: 30,
            unlockLevel: 5
        },
        special: {
            id: 'nigromante_special',
            name: 'Invocación de Muerte',
            type: 'special_power',
            emoji: '<:InvocacindeMuertePoderEs:1441993538312077395>',
            description: 'Ejecuta enemigos con baja vida.',
            damageMult: 5.5,
            energyCost: 70,
            unlockLevel: 15
        }
    },

    // ==========================================
    // CLASE: ANCESTRAL
    // ==========================================
    ancestral: {
        basic: {
            id: 'ancestral_basic',
            name: 'Golpe Primordial',
            type: 'physical_attack',
            emoji: '<:GolpePrimordialAtaqueBsi:1441983130633502860>',
            description: 'Golpe con energía antigua adaptable.',
            damageMult: 1.8,
            energyCost: 10,
            unlockLevel: 1
        },
        power: {
            id: 'ancestral_power',
            name: 'Magia del Antecesor',
            type: 'physical_power',
            emoji: '<:MgiadelAntecesoAtaquFsicoAncestr:1441983170550694081>',
            description: 'Ignora defensa enemiga.',
            damageMult: 3.2,
            energyCost: 30,
            unlockLevel: 5
        },
        special: {
            id: 'ancestral_special',
            name: '7 Caminos Antiguos',
            type: 'special_power',
            emoji: '<:7CaminosAntiguosPoderEs:1441993537196658758>',
            description: 'Combo de 7 golpes elementales.',
            damageMult: 9.5,
            energyCost: 70,
            unlockLevel: 15
        }
    }
};

module.exports = ABILITIES;
