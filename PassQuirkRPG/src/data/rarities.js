/**
 * 💎 Sistema de Rarezas de PassQuirk RPG
 * Define colores, emojis y multiplicadores para cada rareza.
 */

const RARITIES = {
    mundano: {
        id: 'mundano',
        name: 'Mundano',
        emoji: '<:MundanoRarezaPassQuirk:1442244704703090719>',
        color: '#FFFF00', // Amarillo por defecto
        multiplier: 1.0,
        dropRate: 60
    },
    refinado: {
        id: 'refinado',
        name: 'Refinado',
        emoji: '<:RefinadoRarezaPassQuirkR:1442244738244673707>',
        color: '#FFFF00', // Amarillo por defecto
        multiplier: 1.2,
        dropRate: 50
    },
    sublime: {
        id: 'sublime',
        name: 'Sublime',
        emoji: '<:SublimeRarezaPassQuirkR:1442244789553856673>',
        color: '#FFFF00', // Amarillo por defecto
        multiplier: 1.5,
        dropRate: 25
    },
    supremo: {
        id: 'supremo',
        name: 'Supremo',
        emoji: '<:SupremoRarezaPassQuirkR:1442244825041600624>',
        color: '#FFFF00', // Amarillo por defecto
        multiplier: 2.0,
        dropRate: 10
    },
    trascendente: {
        id: 'trascendente',
        name: 'Trascendente',
        emoji: '<:TrascendenteRarezaPassQ:1442244846348927158>',
        color: '#FFFF00', // Amarillo por defecto
        multiplier: 3.0,
        dropRate: 3
    },
    celestial: {
        id: 'celestial',
        name: 'Celestial',
        emoji: '<:CelestialRarezaPassQuirkR:1442244865810235412>',
        color: '#FFFF00', // Amarillo por defecto
        multiplier: 5.0,
        dropRate: 1
    },
    dragon: {
        id: 'dragon',
        name: 'Dragón',
        emoji: '<:DragnRarezaPassQuirkRPG:1442244884688797787>',
        color: '#FFFF00', // Amarillo por defecto
        multiplier: 8.0,
        dropRate: 0.5
    },
    caos: {
        id: 'caos',
        name: 'Caos',
        emoji: '<:CaosRarezaPassQuirkRPG:1442244904779649044>',
        color: '#FFFF00', // Amarillo por defecto
        multiplier: 12.0,
        dropRate: 0.1
    },
    cosmico: {
        id: 'cosmico',
        name: 'Cósmico',
        emoji: '<:CosmicoRarezaPassQuirkR:1442244916788072558>',
        color: '#FFFF00', // Amarillo por defecto
        multiplier: 20.0,
        dropRate: 0.01
    }
};

module.exports = RARITIES;
