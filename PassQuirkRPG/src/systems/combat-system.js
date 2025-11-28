const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { OfficialEmbedBuilder, EMOJIS, COLORS } = require('../utils/embedStyles');

/**
 * ⚔️ Sistema de Combate para PassQuirk RPG
 * Maneja batallas por turnos interactivas.
 */
class CombatSystem {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.activeBattles = new Map();
    }

    /**
     * Maneja interacciones de botones del sistema de combate
     * @param {Object} interaction - Interacción de botón
     */
    async handleButtonInteraction(interaction) {
        const customId = interaction.customId;
        
        if (customId === 'combat_attack') {
            await this.processAction(interaction, 'attack');
            return true;
        }
        
        if (customId === 'combat_flee') {
            await this.processAction(interaction, 'flee');
            return true;
        }

        return false;
    }

    /**
     * Inicia un combate entre jugador y enemigo
     */
    async startBattle(interaction, player, enemyData) {
        const battleId = `battle_${player.userId}_${Date.now()}`;

        // Estructura de batalla
        const battle = {
            id: battleId,
            player: {
                ...player,
                currentHp: player.stats.hp,
                currentMp: player.stats.mp
            },
            enemy: {
                name: enemyData.name,
                level: enemyData.level,
                maxHp: enemyData.hp || (enemyData.level * 50), // Fallback HP
                currentHp: enemyData.hp || (enemyData.level * 50),
                attack: enemyData.attack || (enemyData.level * 5),
                emoji: enemyData.emoji || '👾'
            },
            log: [],
            turn: 1,
            status: 'active',
            // Callback placeholders
            onEnd: null
        };

        this.activeBattles.set(player.userId, battle);
        
        // Mostrar interfaz inicial
        await this.updateBattleEmbed(interaction, battle);
        
        return battle;
    }

    /**
     * Procesa una acción de combate
     */
    async processAction(interaction, action) {
        const userId = interaction.user.id;
        const battle = this.activeBattles.get(userId);

        if (!battle) {
            await interaction.reply({ content: '❌ No hay batalla activa.', ephemeral: true });
            return;
        }

        await interaction.deferUpdate(); // Deferir para evitar timeout y mostrar que se procesa

        // Lógica de huida
        if (action === 'flee') {
            const success = Math.random() > 0.5;
            if (success) {
                if (battle.onEnd) await battle.onEnd(interaction, 'fled');
                else await this.endBattle(interaction, battle, 'fled');
                return;
            }
            battle.log.push('🏃 Intentaste huir pero fallaste.');
        }

        // Turno Jugador (Solo si no huyó)
        if (action === 'attack') {
            // Daño base + aleatorio
            const baseDmg = battle.player.stats.attack;
            const variance = Math.floor(Math.random() * 5);
            let playerDamage = baseDmg + variance;
            let playerMsg = '';
            
            // Crítico (10%)
            const isCrit = Math.random() < 0.1;
            if (isCrit) {
                playerDamage *= 2;
                playerMsg = `💥 **¡GOLPE CRÍTICO!** Atacas a ${battle.enemy.name} por **${playerDamage}** de daño.`;
            } else {
                playerMsg = `⚔️ Atacas a ${battle.enemy.name} por **${playerDamage}** de daño.`;
            }

            battle.enemy.currentHp -= playerDamage;
            battle.log.push(playerMsg);

            // Verificar victoria
            if (battle.enemy.currentHp <= 0) {
                if (battle.onEnd) await battle.onEnd(interaction, 'victory');
                else await this.endBattle(interaction, battle, 'victory');
                return;
            }
        }

        // Turno Enemigo
        const enemyDmg = Math.max(1, battle.enemy.attack - (battle.player.stats.defense / 2));
        battle.player.currentHp -= enemyDmg;
        battle.log.push(`👾 ${battle.enemy.name} te ataca e inflige **${Math.floor(enemyDmg)}** de daño.`);

        // Verificar derrota
        if (battle.player.currentHp <= 0) {
            if (battle.onEnd) await battle.onEnd(interaction, 'defeat');
            else await this.endBattle(interaction, battle, 'defeat');
            return;
        }

        battle.turn++;
        
        // Limitar log
        if (battle.log.length > 5) battle.log = battle.log.slice(-5);

        await this.updateBattleEmbed(interaction, battle);
    }

    /**
     * Actualiza la interfaz de batalla
     */
    async updateBattleEmbed(interaction, battle) {
        const playerHpPercent = Math.floor((battle.player.currentHp / battle.player.stats.maxHp) * 10);
        const enemyHpPercent = Math.floor((battle.enemy.currentHp / battle.enemy.maxHp) * 10);
        
        const playerBar = '🟩'.repeat(playerHpPercent) + '⬜'.repeat(10 - playerHpPercent);
        const enemyBar = '🟥'.repeat(enemyHpPercent) + '⬜'.repeat(10 - enemyHpPercent);

        const embed = new OfficialEmbedBuilder()
            .setOfficialStyle('combat')
            .setOfficialTitle(`Combate: ${battle.player.username} vs ${battle.enemy.name}`, EMOJIS.COMBAT.SWORD)
            .addOfficialField(
                `${battle.enemy.emoji} ${battle.enemy.name} (Nvl ${battle.enemy.level})`, 
                `${enemyBar} **${Math.max(0, battle.enemy.currentHp)}/${battle.enemy.maxHp} HP**`, 
                false
            )
            .addOfficialField(
                `👤 ${battle.player.username}`, 
                `${playerBar} **${Math.max(0, battle.player.currentHp)}/${battle.player.stats.maxHp} HP**`, 
                false
            )
            .addOfficialField(
                '📜 Registro de Batalla',
                battle.log.join('\n') || '¡El combate comienza!',
                false
            );
            
        // Sobrescribir footer con turno
        embed.getEmbed().setFooter({ text: `Turno ${battle.turn} • PassQuirk RPG` });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('combat_attack').setLabel('Atacar').setStyle(ButtonStyle.Danger).setEmoji('⚔️'),
                // new ButtonBuilder().setCustomId('combat_skill').setLabel('Habilidad').setStyle(ButtonStyle.Primary).setEmoji('✨').setDisabled(true), // WIP
                new ButtonBuilder().setCustomId('combat_flee').setLabel('Huir').setStyle(ButtonStyle.Secondary).setEmoji('🏃')
            );

        const payload = { embeds: [embed.getEmbed()], components: [row] };

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply(payload);
        } else {
            await interaction.reply(payload);
        }
    }

    /**
     * Finaliza el combate
     */
    async endBattle(interaction, battle, result) {
        this.activeBattles.delete(battle.player.userId);
        
        // Referencia al sistema de exploración para volver
        const explorationSystem = this.gameManager.systems.exploration;
        const exploration = explorationSystem.activeExplorations.get(battle.player.userId);

        if (result === 'victory') {
            // Recompensas
            const xp = battle.enemy.level * 10;
            const coins = battle.enemy.level * 5;
            
            exploration.stats.enemiesDefeated++;
            exploration.stats.passcoinsFound += coins;
            
            // Actualizar jugador
            await this.gameManager.playerDB.addExperience(interaction, battle.player.userId, xp);
            battle.player.gold += coins;
            await this.gameManager.playerDB.savePlayer(battle.player);

            const embed = new OfficialEmbedBuilder()
                .setOfficialStyle('success')
                .setOfficialTitle('¡VICTORIA!', '🏆')
                .setOfficialDescription(`Has derrotado a **${battle.enemy.name}**.\n\n**Recompensas:**\n✨ +**${xp}** EXP\n${EMOJIS.GOLD} +**${coins}** PassCoins`);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`explore_continue_${exploration.id}`).setLabel('Continuar Explorando').setStyle(ButtonStyle.Success).setEmoji('🗺️')
                );

            exploration.status = 'exploring';
            await interaction.editReply({ embeds: [embed.getEmbed()], components: [row] });

        } else {
            // Derrota
            const embed = new OfficialEmbedBuilder()
                .setOfficialStyle('combat') // O error/danger si existiera estilo específico
                .setOfficialTitle('DERROTA', '💀')
                .setOfficialDescription(`Has sido vencido por **${battle.enemy.name}**. Te retiras para recuperarte.`);
            
            // Sobrescribir color a rojo manualmente si el estilo combat no es suficiente
            embed.getEmbed().setColor(COLORS.DANGER);
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`explore_cancel_${exploration.id}`).setLabel('Volver al Hub').setStyle(ButtonStyle.Secondary).setEmoji('🏠')
                );

            explorationSystem.activeExplorations.delete(battle.player.userId);
            await interaction.editReply({ embeds: [embed.getEmbed()], components: [row] });
        }
    }
}

module.exports = CombatSystem;
