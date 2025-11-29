const { verifyKey } = require('discord-interactions');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { Client, GatewayIntentBits } = require('discord.js');
const PassQuirkGameManager = require('../bot/core/passquirk-game-manager');
const path = require('path');
require('dotenv').config();

// --- CONFIGURATION ---
const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const TOKEN = process.env.DISCORD_TOKEN;

if (!PUBLIC_KEY || !TOKEN) {
    console.error('❌ Missing DISCORD_PUBLIC_KEY or DISCORD_TOKEN');
}

// --- GLOBAL STATE (Persists in Vercel warm/hot lambdas) ---
let gameManager = null;
let restClient = null;

// --- MOCK CLIENT FOR SYSTEMS ---
// Los sistemas esperan un cliente con ciertas propiedades.
const mockClient = {
    user: { id: process.env.CLIENT_ID || 'BOT_ID_PLACEHOLDER', username: 'PassQuirk RPG' },
    users: {
        fetch: async (id) => ({ id, username: 'Unknown', send: () => {} }) // Mock user fetch
    },
    on: () => {},
    emit: () => {},
    ws: { ping: 0 },
    token: TOKEN
};

// --- INITIALIZATION ---
function getGameManager() {
    if (!gameManager) {
        console.log('🔄 Initializing GameManager...');
        gameManager = new PassQuirkGameManager(mockClient);
        restClient = new REST({ version: '10' }).setToken(TOKEN);
        console.log('✅ GameManager Initialized');
    }
    return gameManager;
}

// --- VERCEL INTERACTION WRAPPER ---
// Esta clase adapta la interacción RAW de Discord para que parezca una interacción de Discord.js
// y maneja las respuestas HTTP vs REST API.
class VercelInteraction {
    constructor(data, res) {
        this.raw = data;
        this.res = res;
        this.rest = restClient;
        this.id = data.id;
        this.token = data.token;
        this.applicationId = data.application_id;
        this.type = data.type;
        
        // User/Member data
        this.member = data.member;
        this.user = data.member ? data.member.user : data.user;
        this.guildId = data.guild_id;
        this.channelId = data.channel_id;

        // Component data
        this.customId = data.data?.custom_id;
        this.values = data.data?.values || [];
        
        // Mock options for Slash Commands
        this.options = {
            getString: (name) => data.data?.options?.find(o => o.name === name)?.value,
            getInteger: (name) => data.data?.options?.find(o => o.name === name)?.value,
            getUser: (name) => null, // Complex to implement without caching
            getSubcommand: () => data.data?.options?.find(o => o.type === 1)?.name || null
        };
        
        // State
        this.replied = false;
        this.deferred = false;
        this.ephemeral = false;
    }

    isButton() { return this.type === 3 && !this.values?.length; } // Component Type 3 is Message Component
    isStringSelectMenu() { return this.type === 3 && this.values?.length > 0; } // Simplified check
    isChatInputCommand() { return this.type === 2; }
    isModalSubmit() { return this.type === 5; }

    // --- RESPONSE METHODS ---

    async reply(options) {
        if (this.replied || this.deferred) return this.editReply(options);
        
        this.replied = true;
        this.ephemeral = options.ephemeral || false;
        
        const payload = this._formatPayload(options, 4); // Type 4: CHANNEL_MESSAGE_WITH_SOURCE
        return this.res.status(200).json(payload);
    }

    async update(options) {
        if (this.replied || this.deferred) return this.editReply(options);

        this.replied = true;
        const payload = this._formatPayload(options, 7); // Type 7: UPDATE_MESSAGE
        return this.res.status(200).json(payload);
    }

    async deferReply(options = {}) {
        if (this.replied || this.deferred) return;
        
        this.deferred = true;
        this.ephemeral = options.ephemeral || false;
        
        return this.res.status(200).json({
            type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
            data: { flags: this.ephemeral ? 64 : 0 }
        });
    }

    async deferUpdate() {
        if (this.replied || this.deferred) return;
        
        this.deferred = true;
        return this.res.status(200).json({
            type: 6 // DEFERRED_UPDATE_MESSAGE
        });
    }

    async editReply(options) {
        // If we haven't replied via HTTP yet (shouldn't happen if called correctly), we can't edit.
        // Use REST API to edit the interaction response.
        // Endpoint: PATCH /webhooks/{application.id}/{interaction.token}/messages/@original
        
        try {
            const body = this._formatBody(options);
            await this.rest.patch(Routes.webhookMessage(this.applicationId, this.token, '@original'), {
                body,
                files: options.files // Handle files if possible
            });
        } catch (error) {
            console.error('❌ Error in editReply:', error);
        }
    }
    
    async followUp(options) {
        // POST /webhooks/{application.id}/{interaction.token}
        try {
            const body = this._formatBody(options);
            await this.rest.post(Routes.webhook(this.applicationId, this.token), {
                body,
                files: options.files
            });
        } catch (error) {
            console.error('❌ Error in followUp:', error);
        }
    }

    // --- HELPERS ---

    _formatPayload(options, type) {
        if (typeof options === 'string') options = { content: options };
        
        const data = this._formatBody(options);
        return { type, data };
    }

    _formatBody(options) {
        if (typeof options === 'string') return { content: options };

        const body = {
            content: options.content,
            embeds: options.embeds,
            components: options.components,
            flags: options.ephemeral ? 64 : 0
        };
        
        return body;
    }
}

// --- MAIN HANDLER ---
module.exports = async (req, res) => {
    // 1. Verify Signature
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    const rawBody = JSON.stringify(req.body);

    if (!verifyKey(rawBody, signature, timestamp, PUBLIC_KEY)) {
        console.warn('⚠️ Invalid request signature');
        return res.status(401).send('Invalid request signature');
    }

    const interactionData = req.body;

    // 2. Handle PING (Type 1)
    if (interactionData.type === 1) {
        console.log('🏓 Ping received');
        return res.status(200).json({ type: 1 });
    }

    // 3. Initialize Logic
    const gm = getGameManager();
    const interaction = new VercelInteraction(interactionData, res);

    try {
        // 4. Route Interaction
        // Aquí enrutamos la interacción al sistema correcto basado en customId o commandName
        
        if (interaction.isChatInputCommand()) {
            const commandName = interactionData.data.name;
            console.log(`🚀 Slash Command: ${commandName}`);
            
            // Mapeo manual de comandos a sistemas (simplificado)
            if (commandName === 'explorar') {
                // Llamar directamente a execute del comando si es posible, o simular
                // Por ahora, usaremos el sistema directamente si podemos
                // Pero los comandos están en src/commands/slash...
                // Mejor: Cargar comandos y ejecutar
                
                // Hack rápido: Cargar el archivo del comando y ejecutarlo
                try {
                    const cmd = require(`../src/commands/slash/${commandName}.js`);
                    await cmd.execute(interaction);
                } catch (e) {
                    console.error(`Error ejecutando comando ${commandName}:`, e);
                    await interaction.reply({ content: '❌ Error al ejecutar el comando.', ephemeral: true });
                }
            } 
            else if (commandName === 'inventario' || commandName === 'perfil' || commandName === 'passquirkrpg' || commandName === 'ayuda' || commandName === 'admin' || commandName === 'nivel') {
                 try {
                    const cmd = require(`../src/commands/slash/${commandName}.js`);
                    await cmd.execute(interaction);
                } catch (e) {
                    console.error(`Error ejecutando comando ${commandName}:`, e);
                    await interaction.reply({ content: '❌ Error al ejecutar el comando.', ephemeral: true });
                }
            }
            else {
                await interaction.reply({ content: '⚠️ Comando no implementado en Vercel aún.', ephemeral: true });
            }
        } 
        else if (interaction.isButton() || interaction.isStringSelectMenu()) {
            const customId = interaction.customId;
            console.log(`🔘 Component: ${customId}`);

            // Enrutamiento de Componentes
            if (customId.startsWith('explore_') || customId === 'btn_explorar_manual' || customId === 'btn_volver_menu') {
                await gm.systems.exploration.handleInteraction(interaction);
            } 
            else if (customId.startsWith('combat_') || customId.startsWith('skill_') || customId.startsWith('item_')) {
                await gm.systems.combat.handleInteraction(interaction);
            }
            else if (customId.startsWith('inv_')) {
                await gm.systems.inventory.handleInteraction(interaction);
            }
            else if (customId.startsWith('shop_')) {
                // Shop system might be static
                // await gm.systems.shop.handleInteraction(interaction);
            }
            else if (customId.startsWith('hub_') || customId === 'iniciar_aventura') {
                // Handle hub buttons
                if (customId === 'iniciar_aventura') {
                     const cmd = require(`../src/commands/slash/passquirkrpg.js`);
                     await cmd.execute(interaction);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error handling interaction:', error);
        // Try to reply if not already done
        if (!interaction.replied && !interaction.deferred) {
            res.status(500).json({
                type: 4,
                data: { content: '❌ Error interno del servidor.', flags: 64 }
            });
        }
    }
};
