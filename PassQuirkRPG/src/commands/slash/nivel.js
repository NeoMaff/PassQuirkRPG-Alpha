const { SlashCommandBuilder } = require('discord.js');
const { OfficialEmbedBuilder, EMOJIS, COLORS } = require('../../utils/embedStyles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nivel')
        .setDescription('Muestra tu nivel actual, experiencia y progreso.'),
    async execute(interaction, client) {
        await interaction.deferReply(); // Diferir respuesta para evitar timeouts o duplicados

        const player = await client.gameManager.getPlayer(interaction.user.id);
        if (!player) return interaction.editReply({ content: '❌ No tienes personaje.', ephemeral: true });

        const levelSystem = client.gameManager.systems.level; 
        
        // Asegurar canales
        if (interaction.guild) {
            try {
                await levelSystem.ensureChannels(interaction.guild);
            } catch (e) {
                console.error('Error asegurando canales:', e);
            }
        }

        const currentXp = player.xp || 0;
        const nextXp = levelSystem.calculateXpForNextLevel(player.level);
        const progressBar = levelSystem.generateProgressBar(currentXp, nextXp, 15);

        const embed = new OfficialEmbedBuilder()
            .setOfficialStyle('info')
            .setTitle(`Nivel de ${interaction.user.username}`)
            .setThumbnail(player.profileIcon || player.avatar_url || interaction.user.displayAvatarURL())
            .setDescription(`**Nivel ${player.level}**\n${progressBar}\n\nXP: \`${currentXp} / ${nextXp}\``)
            .addFields(
                { name: 'Próximo Desbloqueo', value: '🔒 Habilidad de Clase (Nvl 5)', inline: true }
            );

        await interaction.editReply({ embeds: [embed.getEmbed()] });
    }
};