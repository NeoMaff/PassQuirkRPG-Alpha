const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, UserSelectMenuBuilder } = require('discord.js');
const { loadTutorialState, saveTutorialState } = require('../../../bot/utils/persistence');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Abre el panel de administración interactivo')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ Panel de Administración')
            .setDescription('Selecciona una categoría para ver las acciones disponibles.')
            .setColor('#FF0000');

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('admin_panel_select')
                    .setPlaceholder('Selecciona una categoría...')
                    .addOptions([
                        { label: 'General', value: 'admin_general', description: 'Reset tutorial, personaje...', emoji: '⚙️' },
                        { label: 'Economía', value: 'admin_economy', description: 'Añadir/Quitar dinero', emoji: '💰' },
                        { label: 'Jugadores', value: 'admin_players', description: 'Niveles, stats...', emoji: '👤' }
                    ])
            );
        
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },

    async handleInteraction(interaction, client) {
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'admin_panel_select') {
                const selection = interaction.values[0];
                
                if (selection === 'admin_general') {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('admin_btn_reset_tutorial')
                                .setLabel('Reset Tutorial')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🔄'),
                            new ButtonBuilder()
                                .setCustomId('admin_btn_delete_char')
                                .setLabel('Borrar Personaje')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('🗑️')
                        );
                    
                    await interaction.reply({
                        content: '⚙️ **Gestión General**\nSelecciona una acción:',
                        components: [row],
                        ephemeral: true
                    });
                } else if (selection === 'admin_economy') {
                     const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('admin_btn_eco_add')
                                .setLabel('Añadir Dinero')
                                .setStyle(ButtonStyle.Success)
                                .setEmoji('💰'),
                            new ButtonBuilder()
                                .setCustomId('admin_btn_eco_remove')
                                .setLabel('Quitar Dinero')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('💸')
                        );

                     await interaction.reply({
                        content: '💰 **Economía**\nSelecciona una acción:',
                        components: [row],
                        ephemeral: true
                    });
                } else if (selection === 'admin_players') {
                     const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('admin_btn_player_level')
                                .setLabel('Establecer Nivel')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('⬆️')
                        );

                     await interaction.reply({
                        content: '👤 **Jugadores**\nSelecciona una acción:',
                        components: [row],
                        ephemeral: true
                    });
                }
            }
        }
        else if (interaction.isButton()) {
            if (interaction.customId === 'admin_btn_reset_tutorial') {
                const row = new ActionRowBuilder().addComponents(
                    new UserSelectMenuBuilder().setCustomId('admin_sel_user_reset_tutorial').setPlaceholder('Selecciona usuario')
                );
                await interaction.reply({ content: 'Selecciona el usuario:', components: [row], ephemeral: true });
            }
            else if (interaction.customId === 'admin_btn_delete_char') {
                const row = new ActionRowBuilder().addComponents(
                    new UserSelectMenuBuilder().setCustomId('admin_sel_user_delete_char').setPlaceholder('Selecciona usuario')
                );
                await interaction.reply({ content: 'Selecciona el usuario (¡Acción Destructiva!):', components: [row], ephemeral: true });
            }
            else if (interaction.customId === 'admin_btn_eco_add') {
                const row = new ActionRowBuilder().addComponents(
                    new UserSelectMenuBuilder().setCustomId('admin_sel_user_eco_add').setPlaceholder('Selecciona usuario')
                );
                await interaction.reply({ content: 'Selecciona a quién añadir dinero:', components: [row], ephemeral: true });
            }
            else if (interaction.customId === 'admin_btn_eco_remove') {
                const row = new ActionRowBuilder().addComponents(
                    new UserSelectMenuBuilder().setCustomId('admin_sel_user_eco_remove').setPlaceholder('Selecciona usuario')
                );
                await interaction.reply({ content: 'Selecciona a quién quitar dinero:', components: [row], ephemeral: true });
            }
            else if (interaction.customId === 'admin_btn_player_level') {
                const row = new ActionRowBuilder().addComponents(
                    new UserSelectMenuBuilder().setCustomId('admin_sel_user_level').setPlaceholder('Selecciona usuario')
                );
                await interaction.reply({ content: 'Selecciona el usuario para cambiar nivel:', components: [row], ephemeral: true });
            }
        }
        else if (interaction.isUserSelectMenu()) {
            // ... (Existing handlers for reset/delete) ...
            if (interaction.customId === 'admin_sel_user_reset_tutorial') {
                const userId = interaction.values[0];
                const state = loadTutorialState();
                if (state.has(userId)) {
                    state.delete(userId);
                    saveTutorialState(state);
                    await interaction.reply({ content: `✅ Tutorial reseteado para <@${userId}>.`, ephemeral: true });
                } else {
                    await interaction.reply({ content: `⚠️ No se encontraron datos de tutorial para <@${userId}>.`, ephemeral: true });
                }
            }
            else if (interaction.customId === 'admin_sel_user_delete_char') {
                const userId = interaction.values[0];
                try {
                    await client.gameManager.playerDB.deletePlayer(userId);
                    const state = loadTutorialState();
                    if (state.has(userId)) { state.delete(userId); saveTutorialState(state); }
                    await interaction.reply({ content: `🗑️ Personaje de <@${userId}> eliminado correctamente.`, ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: `❌ Error al eliminar personaje.`, ephemeral: true });
                }
            }
            else if (interaction.customId === 'admin_sel_user_eco_add' || interaction.customId === 'admin_sel_user_eco_remove' || interaction.customId === 'admin_sel_user_level') {
                // Show Modal for Amount/Level
                const userId = interaction.values[0];
                const action = interaction.customId; // admin_sel_user_eco_add, etc.
                
                // We need to pass the userId to the modal. We can encode it in customId.
                // Format: admin_modal_<action>_<userId>
                let modalId = '';
                let label = '';
                
                if (action === 'admin_sel_user_eco_add') { modalId = `admin_modal_eco_add_${userId}`; label = 'Cantidad a Añadir'; }
                else if (action === 'admin_sel_user_eco_remove') { modalId = `admin_modal_eco_remove_${userId}`; label = 'Cantidad a Quitar'; }
                else if (action === 'admin_sel_user_level') { modalId = `admin_modal_level_${userId}`; label = 'Nuevo Nivel'; }
                
                const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
                const modal = new ModalBuilder().setCustomId(modalId).setTitle('Configuración');
                const input = new TextInputBuilder()
                    .setCustomId('admin_input_value')
                    .setLabel(label)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 100')
                    .setRequired(true);
                    
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            }
        }
        else if (interaction.isModalSubmit()) {
            const id = interaction.customId;
            if (id.startsWith('admin_modal_')) {
                const parts = id.split('_');
                // id: admin_modal_eco_add_<userId> -> parts: [admin, modal, eco, add, userId]
                // or admin_modal_level_<userId> -> parts: [admin, modal, level, userId]
                
                const userId = parts[parts.length - 1];
                const actionType = parts[2]; // eco or level
                const subType = parts[3]; // add or remove (if eco)
                
                const value = parseInt(interaction.fields.getTextInputValue('admin_input_value'));
                if (isNaN(value)) {
                    await interaction.reply({ content: '❌ Por favor ingresa un número válido.', ephemeral: true });
                    return;
                }
                
                const player = await client.gameManager.getPlayer(userId);
                if (!player) {
                    await interaction.reply({ content: `❌ El usuario <@${userId}> no tiene personaje.`, ephemeral: true });
                    return;
                }
                
                if (actionType === 'level') {
                    player.level = value;
                    player.stats.maxHp = 100 + ((value - 1) * 10);
                    player.stats.hp = player.stats.maxHp;
                    player.stats.maxMp = 50 + ((value - 1) * 5);
                    player.stats.mp = player.stats.maxMp;
                    await client.gameManager.playerDB.savePlayer(player);
                    await interaction.reply({ content: `✅ Nivel de <@${userId}> establecido a **${value}**.`, ephemeral: true });
                }
                else if (actionType === 'eco') {
                    if (!player.economy) player.economy = { passcoins: 0, gems: 0 };
                    
                    if (subType === 'add') {
                        player.economy.passcoins += value;
                        await client.gameManager.playerDB.savePlayer(player);
                        await interaction.reply({ content: `✅ **+${value}** PassCoins para <@${userId}>. Total: ${player.economy.passcoins}`, ephemeral: true });
                    }
                    else if (subType === 'remove') { // eco_remove
                        player.economy.passcoins = Math.max(0, player.economy.passcoins - value);
                        await client.gameManager.playerDB.savePlayer(player);
                        await interaction.reply({ content: `✅ **-${value}** PassCoins a <@${userId}>. Total: ${player.economy.passcoins}`, ephemeral: true });
                    }
                }
            }
        }
    }
};
