  const { EmbedBuilder } = require('discord.js');

class WorldSystem {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.state = {
            weather: { name: 'Soleado', emoji: '☀️' },
            localTime: '12:00',
            cycle: 'day' // day/night
        };
        
        // Actualizar estado periódicamente
        setInterval(() => this.updateWorldState(), 60000 * 10); // Cada 10 min
    }

    getWorldState() {
        return this.state;
    }

    updateWorldState() {
        // Lógica simple de rotación de clima/tiempo
        const weathers = [
            { name: 'Soleado', emoji: '☀️' },
            { name: 'Nublado', emoji: '☁️' },
            { name: 'Lluvioso', emoji: '🌧️' },
            { name: 'Tormenta', emoji: '⛈️' },
            { name: 'Despejado', emoji: '🌙' } // Noche
        ];

        const now = new Date();
        const hour = now.getHours();
        const isNight = hour < 6 || hour > 20;

        this.state.localTime = `${hour.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        this.state.cycle = isNight ? 'night' : 'day';

        if (isNight && Math.random() > 0.3) {
            this.state.weather = { name: 'Despejado', emoji: '🌙' };
        } else {
            this.state.weather = weathers[Math.floor(Math.random() * (weathers.length - 1))];
        }
    }
}

module.exports = WorldSystem;
