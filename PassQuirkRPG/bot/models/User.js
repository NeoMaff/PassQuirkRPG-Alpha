// 👤 MODELO USER - Esquema de base de datos para usuarios
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

let User;

// Check if sequelize is a valid Sequelize instance (has define method)
// Note: In current architecture, database.js exports { connectDatabase, closeDatabase }, not the sequelize instance directly.
// This model is kept for legacy compatibility but operates in mock mode when sequelize is missing.
if (sequelize && typeof sequelize.define === 'function') {
    User = sequelize.define('User', {
        userId: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            unique: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false
        },
        balance: {
            type: DataTypes.INTEGER,
            defaultValue: 1000
        },
        gems: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        pg: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        lastDaily: {
            type: DataTypes.DATE,
            allowNull: true
        },
        lastWork: {
            type: DataTypes.DATE,
            allowNull: true
        },
        dailyStreak: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        
        // Campos específicos del RPG
        characterName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        characterClass: {
            type: DataTypes.ENUM('Celestial', 'Fenix', 'Berserker', 'Inmortal', 'Demon', 'Sombra'),
            allowNull: true
        },
        characterRegion: {
            type: DataTypes.STRING,
            allowNull: true
        },
        characterLevel: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        characterExp: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        
        // Estadísticas de combate
        hp: { type: DataTypes.INTEGER, defaultValue: 100 },
        maxHp: { type: DataTypes.INTEGER, defaultValue: 100 },
        mp: { type: DataTypes.INTEGER, defaultValue: 50 },
        maxMp: { type: DataTypes.INTEGER, defaultValue: 50 },
        attack: { type: DataTypes.INTEGER, defaultValue: 10 },
        defense: { type: DataTypes.INTEGER, defaultValue: 5 },
        speed: { type: DataTypes.INTEGER, defaultValue: 10 },
        
        // Estado
        hasCharacter: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isBanned: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        
        // Stats de uso del bot
        stats: {
            type: DataTypes.JSON,
            defaultValue: {}
        }
    });
} else {
    // Mock User model for legacy compatibility
    // console.warn('⚠️ Sequelize not available in User.js. Model running in mock mode.');
    User = {
        findOne: async () => null,
        create: async () => ({ save: async () => {}, stats: {} }),
        destroy: async () => {},
        hasOne: () => {},
        belongsTo: () => {},
        sync: async () => {}
    };
}

module.exports = User;
