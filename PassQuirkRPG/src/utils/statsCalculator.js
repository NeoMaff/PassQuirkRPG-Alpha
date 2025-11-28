/**
 * 📊 Calculadora de Estadísticas - PassQuirk RPG
 * Implementa la lógica de escalamiento oficial:
 * - Bonos raciales multiplicativos.
 * - Crecimiento por nivel: 1.15x por nivel.
 * - Salto de poder: 1.7x cada 10 niveles.
 */

const { RACES } = require('../data/passquirk-official-data');

/**
 * Calcula las estadísticas finales de un personaje basado en su clase, raza y nivel.
 * @param {Object} baseStats - Estadísticas base de la clase { hp, mp, attack, defense, speed }
 * @param {string} razaId - ID de la raza (ej: 'humanos')
 * @param {number} nivel - Nivel actual del personaje (default 1)
 * @returns {Object} Estadísticas finales redondeadas
 */
function calculateStats(baseStats, razaId, nivel = 1) {
    const raza = RACES[razaId.toUpperCase()];
    const multRaza = raza ? (raza.multipliers || {}) : {};

    // Multiplicadores base (default 1.0)
    const mHp = multRaza.hp || 1.0;
    const mMp = multRaza.mp || 1.0;
    const mAtk = multRaza.attack || 1.0;
    const mDef = multRaza.defense || 1.0;
    const mSpd = multRaza.speed || 1.0;

    // Factores de crecimiento por nivel
    // Nivel 1 = 1.0
    // Nivel 2 = 1.15
    // Cada 10 niveles se multiplica por 1.7 ADICIONAL
    const growthPerLevel = 0.15; // +15%
    const boostEvery10 = 1.7;    // x1.7

    // Calcular multiplicador de nivel
    // Formula: (1 + growth)^(level-1) * (boost^floor(level/10))
    // Nota: El boost de nivel 10 se aplica AL LLEGAR al 10 (asumo).
    // Si nivel < 10, factor10 = 1.
    
    let levelMultiplier = Math.pow(1 + growthPerLevel, nivel - 1);
    
    const decades = Math.floor(nivel / 10);
    if (decades > 0) {
        levelMultiplier *= Math.pow(boostEvery10, decades);
    }

    return {
        hp: Math.round(baseStats.hp * mHp * levelMultiplier),
        mp: Math.round(baseStats.mp * mMp * levelMultiplier),
        attack: Math.round(baseStats.attack * mAtk * levelMultiplier),
        defense: Math.round(baseStats.defense * mDef * levelMultiplier),
        speed: Math.round(baseStats.speed * mSpd * levelMultiplier),
        // Stats derivados/extra
        magic_power_mult: (multRaza.magic_power || 1.0),
        crit_chance_bonus: (multRaza.crit_chance_flat || 0),
        mp_regen_bonus: (multRaza.mp_regen_flat || 0)
    };
}

/**
 * Calcula la experiencia necesaria para el siguiente nivel.
 * Fórmula estándar RPG (ajustable): Base * (nivel ^ factor)
 */
function calculateNextLevelExp(level) {
    const baseExp = 100;
    return Math.floor(baseExp * Math.pow(level, 1.5));
}

module.exports = {
    calculateStats,
    calculateNextLevelExp
};
