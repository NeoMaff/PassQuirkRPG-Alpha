const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('../utils/embedStyles');
const RARITIES = require('../data/rarities');

/**
 * Sistema Passystem para PassQuirk RPG
 * Maneja la minería y pesca durante la exploración
 */
class PassSystem {
    constructor() {
        // Herramientas y sus modificadores
        // Nombres sincronizados con shop-system.js
        this.tools = {
            pickaxes: {
                'mundano': { power: 1, durability: 50, name: 'Pico Mundano' },
                'refinado': { power: 1.5, durability: 80, name: 'Pico Refinado' },
                'sublime': { power: 2, durability: 120, name: 'Pico Sublime' },
                'supremo': { power: 3, durability: 180, name: 'Pico Supremo' },
                'trascendente': { power: 5, durability: 250, name: 'Pico Trascendente' },
                'celestial': { power: 8, durability: 350, name: 'Pico Celestial' },
                'dragon': { power: 12, durability: 500, name: 'Pico Dragón' },
                'caos': { power: 20, durability: 750, name: 'Pico del Caos' },
                'cosmico': { power: 50, durability: 1000, name: 'Pico Cósmico' }
            },
            rods: {
                'mundano': { power: 1, durability: 50, name: 'Caña Mundana' },
                'refinado': { power: 1.5, durability: 80, name: 'Caña Refinada' },
                'sublime': { power: 2, durability: 120, name: 'Caña Sublime' },
                'supremo': { power: 3, durability: 180, name: 'Caña Suprema' },
                'trascendente': { power: 5, durability: 250, name: 'Caña Trascendente' },
                'celestial': { power: 8, durability: 350, name: 'Caña Celestial' },
                'dragon': { power: 12, durability: 500, name: 'Caña Dragón' },
                'caos': { power: 20, durability: 750, name: 'Caña del Caos' },
                'cosmico': { power: 50, durability: 1000, name: 'Caña Cósmica' }
            }
        };

        // Materiales de Minería por Rareza
        this.miningDrops = {
            'mundano': ['Fragmento de Piedra', 'Roca de Granito'],
            'refinado': ['Lingote de Hierro', 'Mineral de Cobre'],
            'sublime': ['Cristal Pulido', 'Mineral de Plata', 'Cristal Azul'],
            'supremo': ['Pepita de Oro', 'Gema Roja'],
            'trascendente': ['Esencia Eterna', 'Mineral Trascendente'],
            'celestial': ['Polvo Divino', 'Cristal Divino', 'Mineral Celestial'],
            'dragon': ['Escama Dracónica', 'Escama de Dragón Petrificada', 'Mineral Dracónico'],
            'caos': ['Núcleo del Caos', 'Fragmento del Caos', 'Mineral Corrupto'],
            'cosmico': ['Fragmento Estelar', 'Mineral Cósmico']
        };

        // Materiales de Pesca por Rareza
        this.fishingDrops = {
            'mundano': ['Escama Común', 'Pez Común', 'Carpa Gris'],
            'refinado': ['Perla Pequeña', 'Trucha Plateada', 'Bagre Azul'],
            'sublime': ['Perla Brillante', 'Salmón Dorado', 'Atún Brillante'],
            'supremo': ['Perla Dorada', 'Pez Espada Místico', 'Manta Raya Cristalina'],
            'trascendente': ['Lágrima del Océano Eterno', 'Kraken Eterno', 'Ballena del Fin del Mundo'],
            'celestial': ['Esencia Marina', 'Pez Ángel Divino', 'Delfín Celestial'],
            'dragon': ['Colmillo de Leviatán', 'Serpiente Marina Dracónica', 'Leviatán Juvenil'],
            'caos': ['Núcleo Abisal', 'Fragmento de Vacío', 'Pez Pesadilla'],
            'cosmico': ['Fragmento Oceánico', 'Anguila Estelar', 'Medusa Cósmica']
        };
        
        // Rangos de PassCoins por Rareza
        this.coinRanges = {
            'mundano': [5, 10],
            'refinado': [15, 25],
            'sublime': [35, 50],
            'supremo': [60, 90],
            'trascendente': [100, 150],
            'celestial': [180, 250],
            'dragon': [300, 450],
            'caos': [500, 750],
            'cosmico': [800, 1200]
        };
    }

    /**
     * Genera un evento de minería o pesca
     * @param {string} type 'mining' o 'fishing'
     * @param {string} zoneRarityCap Rareza máxima de la zona (ej. 'Refinado')
     * @param {Object} playerTools Herramientas del jugador (opcional)
     */
    generateEvent(type, zoneRarityCap = 'refinado') {
        const drops = type === 'mining' ? this.miningDrops : this.fishingDrops;
        const emoji = type === 'mining' ? '⛏️' : '🎣';
        const actionName = type === 'mining' ? 'Nodo de Minería' : 'Zona de Pesca';

        // Normalizar cap a lowercase
        const cap = zoneRarityCap.toLowerCase();

        // Calcular rareza del drop basado en probabilidades y cap de zona
        const rarityKey = this.calculateRarity(cap);
        const rarityData = RARITIES[rarityKey] || RARITIES.mundano;
        
        const possibleDrops = drops[rarityKey] || drops.mundano;
        const dropName = possibleDrops[Math.floor(Math.random() * possibleDrops.length)];

        // Cantidad aleatoria (1-3)
        const amount = Math.floor(Math.random() * 3) + 1;
        
        // Valor en PassCoins estimado
        const range = this.coinRanges[rarityKey] || this.coinRanges.mundano;
        // Valor aleatorio dentro del rango
        const baseValue = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
        const value = baseValue; // Valor total por la acción

        return {
            type: 'passystem', // Identificador para ExplorationSystem
            subtype: type,
            name: actionName,
            description: `Has encontrado un ${actionName}.`,
            drop: {
                name: dropName,
                rarity: rarityData.name, // Nombre Capitalizado para display
                rarityId: rarityKey,
                amount: amount,
                value: value,
                color: rarityData.color,
                emoji: rarityData.emoji
            },
            emoji: emoji
        };
    }

    /**
     * Calcula la rareza del drop usando dropRates de RARITIES
     * @param {string} cap Rareza máxima permitida (lowercase)
     */
    calculateRarity(cap) {
        // Orden de rarezas
        const rarityOrder = ['mundano', 'refinado', 'sublime', 'supremo', 'trascendente', 'celestial', 'dragon', 'caos', 'cosmico'];
        
        // Determinar índice del cap
        const capIndex = rarityOrder.indexOf(cap);
        const effectiveCapIndex = capIndex === -1 ? 0 : capIndex; // Si no encuentra, solo mundano

        // Filtrar rarezas permitidas y calcular peso total
        let totalWeight = 0;
        const allowedRarities = [];

        for (let i = 0; i <= effectiveCapIndex; i++) {
            const key = rarityOrder[i];
            const rarity = RARITIES[key];
            if (rarity) {
                allowedRarities.push({ key, weight: rarity.dropRate });
                totalWeight += rarity.dropRate;
            }
        }

        // Selección ponderada
        const roll = Math.random() * totalWeight;
        let currentWeight = 0;

        for (const r of allowedRarities) {
            currentWeight += r.weight;
            if (roll <= currentWeight) {
                return r.key;
            }
        }

        return 'mundano'; // Fallback
    }
}

module.exports = new PassSystem();
