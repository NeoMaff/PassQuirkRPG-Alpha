// const { connectDatabase } = require('../config/database'); // DESACTIVADO - Bot usa Supabase
const { ActivityType } = require('discord.js');
const playerDatabase = require('../../src/data/player-database');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        // console.log('🔗 Conectando a la base de datos...'); // DESACTIVADO - Bot usa Supabase
        // await connectDatabase();

        // Inicializar el sistema de base de datos de jugadores
        console.log('🎮 Inicializando sistema de jugadores...');
        client.playerDatabase = playerDatabase;
        console.log('✅ Sistema de jugadores inicializado');

        console.log(`✅ ${client.user.tag} está listo!`);

        // Configurar actividad del bot
        client.user.setActivity('PassQuirk RPG | /passquirkrpg', {
            type: ActivityType.Playing
        });
    },
};
