const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, ChannelType, PermissionFlagsBits, ComponentType } = require('discord.js');
const animatedEmojis = require('../../../bot/utils/animatedEmojis');
const { BASE_CLASSES, RACES } = require('../../data/passquirk-official-data');
const { calculateStats } = require('../../utils/statsCalculator');
const { PlayerDatabase } = require('../../data/player-database');
const { generarMensajeEmbed } = require('../../../bot/utils/embedGenerator');
const musicManager = require('../../../bot/utils/musicManager');
const { saveTutorialState, loadTutorialState } = require('../../../bot/utils/persistence');
const { getEmoji } = require('../../../bot/utils/emojiManager');
const path = require('path');
const fs = require('fs');

// --- ESTADO GLOBAL ---
const datosPersonaje = loadTutorialState();
function guardarEstado() { saveTutorialState(datosPersonaje); }
const estadosCombate = new Map();

// Helper para obtener la BD global
function getPlayerDB(interaction) {
    if (!interaction.client.gameManager) {
        throw new Error('GameManager no inicializado en el cliente.');
    }
    return interaction.client.gameManager.playerDB;
}

const ESTADOS = {
    NO_INICIADO: 'NO_INICIADO',
    CREANDO_PERSONAJE: 'CREANDO_PERSONAJE',
    ELIGIENDO_GENERO: 'ELIGIENDO_GENERO',
    ELIGIENDO_RAZA: 'ELIGIENDO_RAZA', // Nuevo estado para selección de raza
    ELIGIENDO_CLASE: 'ELIGIENDO_CLASE',
    ELIGIENDO_REINO: 'ELIGIENDO_REINO',
    COMBATE_TUTORIAL: 'COMBATE_TUTORIAL',
    TUTORIAL_COMPLETADO: 'TUTORIAL_COMPLETADO'
};

const COLORES = {
    AMARILLO_TUTORIAL: 0xfcd34d,
    ROJO_PELIGRO: 0xdc2626,
    VERDE_EXITO: 0x10b981,
    PURPURA_MISTICO: 0x9B59B6
};

// Rutas de Assets (Locales para ElSabio/Slime, URLs para Clases/Razas)
const ASSETS_PATH = 'e:/PassQuirk/PassQuirkRPG/Documentación - Juego/Assets - PassQuirkRPG';
const PATHS = {
    SABIO_IMG: path.join(ASSETS_PATH, 'Npcs/Tutorial_Sabio.png'),
    SABIO_BANNER: path.join(ASSETS_PATH, 'Npcs/Tutorial_Sabio-1920x1080.png'),
    SABIO_GIF: path.join(ASSETS_PATH, 'Npcs/GIF/ElSabio-Video-de-cuando-habla.gif'),
    SLIME_IMG: path.join(ASSETS_PATH, 'Enemigos - Antiguos/SlimeTutorial_Nvl1.png'),
    ICONO_V1: path.join(ASSETS_PATH, 'Iconos - Marca - PassQuirk/Icono - PassQuirk V1.png'),
    MUSIC_AVENTURA: 'e:/PassQuirk/PassQuirkRPG/documentation/Doc-Oficial/Música/Aventura - PassQuirk.wav',
    MUSIC_COMBATE: 'e:/PassQuirk/PassQuirkRPG/documentation/Doc-Oficial/Música/Lucha - Battle Cry.mp3',
    MUSIC_ECONOMIA: 'e:/PassQuirk/PassQuirkRPG/documentation/Doc-Oficial/Música/Economia - PassQuirk.wav'
};

const VARIABLES_MUSICA = {
    MENU: { file: PATHS.MUSIC_AVENTURA, volumen: 0.5, loop: true },
    COMBATE: { file: PATHS.MUSIC_COMBATE, volumen: 0.8, loop: true },
    ECONOMIA: { file: PATHS.MUSIC_ECONOMIA, volumen: 0.6, loop: true },
    VICTORIA: { file: 'e:/PassQuirk/PassQuirkRPG/documentation/Doc-Oficial/Música/Victoria - Fanfarria.mp3', volumen: 1.0, loop: false }
};

// Mapeo de Clases Oficiales para el Tutorial
const CLASES_OFICIALES = Object.entries(BASE_CLASSES).reduce((acc, [key, val]) => {
    // Filtrar clases no seleccionables (ej. Ancestral)
    if (val.selectable === false) return acc;
    
    const id = key.toLowerCase();
    acc[id] = {
        name: key.charAt(0) + key.slice(1).toLowerCase(), // Capitalize (e.g. Celestial)
        emoji: val.emoji,
        desc: val.description,
        role: val.role,
        style: val.style,
        baseStats: val.baseStats, // Preservar objeto original para compatibilidad
        statsImage: val.statsImage, // URL de imagen de estadísticas
        stats: { hp: val.baseStats.hp, energy: val.baseStats.mp, atk: val.baseStats.attack, def: val.baseStats.defense, spd: val.baseStats.speed },
        abilities: val.abilities, // Pasar el objeto completo de habilidades (con emojis y datos)
        icon: val.image, // URL
        banner: val.image, // URL (Usamos la imagen de clase como banner/main image)
        image: val.image // Propiedad image explícita
    };
    return acc;
}, {});

// Mapeo de Razas Oficiales
const RAZAS_OFICIALES = Object.entries(RACES).reduce((acc, [key, val]) => {
    const id = key.toLowerCase();
    acc[id] = {
        name: val.name,
        emoji: val.emoji,
        desc: val.description,
        bonuses: val.bonuses,
        stats: val.stats,
        image: val.image
    };
    return acc;
}, {});

// Definición de Objetos de la Armería (Centralizado)
const ITEMS_ARMERIA = [
    { id: 'pocion_vida_pequena', name: 'Poción de Vida (P)', price: 20, type: 'consumable', emoji: '🧪', desc: 'Recupera 50 HP.' },
    { id: 'pocion_mana_pequena', name: 'Poción de Maná (P)', price: 30, type: 'consumable', emoji: '💧', desc: 'Recupera 30 MP.' },
    { id: 'espada_entrenamiento', name: 'Espada de Madera', price: 100, type: 'weapon', emoji: '🗡️', desc: 'ATK +5 (Entrenamiento)' },
    { id: 'escudo_entrenamiento', name: 'Escudo de Madera', price: 80, type: 'armor', emoji: '🛡️', desc: 'DEF +3 (Básico)' }
];

const REINOS_OFICIALES = {
    reino_mirai: { name: 'Reino Mirai', emoji: '👤', desc: 'Capital de la Humanidad. Innovación y tecnología.' },
    reino_kyojin: { name: 'Reino Kyojin', emoji: '🧌', desc: 'Capital de los Ogros. Fuerza y fuego volcánico.' },
    reino_kogane: { name: 'Reino Kogane', emoji: '🪓', desc: 'Capital de los Enanos. Forja y profundidades.' },
    reino_seirei: { name: 'Reino Seirei', emoji: '🧝', desc: 'Capital de los Elfos. Magia y naturaleza ancestral.' }
};

const RAZA_TO_REINO = {
    'HUMANOS': 'reino_mirai',
    'OGROS': 'reino_kyojin',
    'ENANOS': 'reino_kogane',
    'ELFOS': 'reino_seirei'
};

// --- FUNCIONES AUXILIARES ---
function crearBarraVida(nombre, vidaActual, vidaMaxima) {
    const porcentaje = (vidaActual / vidaMaxima) * 100;
    const barras = 10;
    const barrasLlenas = Math.floor((porcentaje / 100) * barras);
    const barrasVacias = barras - barrasLlenas;
    let emoji = '❤️';
    if (porcentaje <= 25) emoji = '💔';
    else if (porcentaje <= 50) emoji = '🧡';
    else if (porcentaje <= 75) emoji = '💛';
    const barra = '█'.repeat(barrasLlenas) + '░'.repeat(barrasVacias);
    return `${emoji} **${nombre}:** \`${barra}\` ${vidaActual}/${vidaMaxima} HP`;
}

function obtenerQuirkAleatorio() {
    return { name: 'Fuerza Básica', desc: 'Aumenta el daño físico' };
}

// Helper para obtener datos del personaje de forma segura (Memoria -> Disco)
function getUserDataSafe(userId) {
    let userData = datosPersonaje.get(userId);
    if (!userData) {
        const loadedData = loadTutorialState();
        userData = loadedData.get(userId);
        if (userData) {
            datosPersonaje.set(userId, userData);
        }
    }
    return userData;
}

// --- LÓGICA DEL TUTORIAL ---

async function iniciarTutorialElSabio(interaction) {
    await preguntarMusica(interaction);
}

async function preguntarMusica(interaction) {
    const emojiMusica = '🎵';
    const emojiSabio = '🧙‍♂️';
    
    const mensaje = generarMensajeEmbed({
        titulo: `${emojiSabio} **Ambientación Musical**`,
        descripcion: `${emojiMusica} **¿Deseas activar la música ambiental?**\n\n` +
            `Para una mejor experiencia inmersiva, te recomendamos activar el sonido.\n` +
            `*El bot se unirá a tu canal de voz para reproducir la banda sonora.*`,
        footer: `${emojiSabio} ElSabio • Configuración`,
        botones: [
            { id: 'tutorial_musica_si', label: 'Sí, activar música', style: ButtonStyle.Success, emoji: '🔊' },
            { id: 'tutorial_musica_no', label: 'No, continuar en silencio', style: ButtonStyle.Secondary, emoji: '🔇' }
        ],
        imagen: 'attachment://Tutorial_Sabio-1920x1080.png',
        banner: true
    });
    
    mensaje.files = [{ attachment: PATHS.SABIO_BANNER, name: 'Tutorial_Sabio-1920x1080.png' }];
    
    if (interaction.deferred || interaction.replied) await interaction.editReply(mensaje);
    else await interaction.reply(mensaje);
}

async function procesarMusica(interaction) {
    try {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
        const quiereMusica = interaction.customId === 'tutorial_musica_si';
        
        // Recuperación de estado robusta
        let userData = datosPersonaje.get(interaction.user.id);
        if (!userData) {
            const loadedData = loadTutorialState();
            userData = loadedData.get(interaction.user.id);
            if (userData) {
                loadedData.forEach((v, k) => datosPersonaje.set(k, v));
            } else {
                // Si no hay datos previos, inicializamos
                userData = { estado: ESTADOS.ELIGIENDO_GENERO }; // Estado inicial asumido
                datosPersonaje.set(interaction.user.id, userData);
            }
        }

        userData.musicaActiva = quiereMusica;
        // Avanzamos estado si es necesario, aunque aquí es preliminar
        datosPersonaje.set(interaction.user.id, userData);
        guardarEstado();
        
        if (quiereMusica && musicManager) {
            try {
                const member = await interaction.guild.members.fetch(interaction.user.id);
                if (member.voice.channel) {
                    await musicManager.joinChannel(member.voice.channel);
                    musicManager.playFile(VARIABLES_MUSICA.MENU.file, VARIABLES_MUSICA.MENU.loop);
                }
            } catch (musicError) {
                console.error('Error al reproducir música:', musicError);
            }
        }
        await mostrarBienvenida(interaction);
    } catch (error) {
        console.error('Error en procesarMusica:', error);
        try {
            await mostrarBienvenida(interaction);
        } catch (e) { console.error('Error fatal en procesarMusica:', e); }
    }
}

async function mostrarBienvenida(interaction) {
    const emojiSparkles = getEmoji('sparkleStars', '✨');
    const emojiSabio = '🧙‍♂️';

    const mensaje = generarMensajeEmbed({
        titulo: `${emojiSabio} **ElSabio te da la bienvenida**`,
        descripcion: `${emojiSparkles} ***¡Saludos, viajero!***\n\n` +
            `Soy **ElSabio**, el guardián de las historias de **PassQuirk**.\n` +
            `He visto muchos rostros pasar por aquí, pero el tuyo... tiene algo especial.\n\n` +
            `*El anciano te mira con curiosidad, ajustándose sus gafas.*\n\n` +
            `**Dime, joven... ¿cuál es tu nombre?**`,
        imagen: 'attachment://Tutorial_Sabio-1920x1080.png',
        banner: true,
        footer: `${emojiSabio} ElSabio • Inicio de la Aventura`,
        botones: [{ id: 'tutorial_step_nombre', label: 'Presentarse', style: ButtonStyle.Primary, emoji: '👋' }]
    });

    mensaje.files = [{ attachment: PATHS.SABIO_BANNER, name: 'Tutorial_Sabio-1920x1080.png' }];
    
    if (interaction.replied || interaction.deferred) await interaction.editReply(mensaje);
    else await interaction.update(mensaje);
}

async function mostrarModalNombre(interaction) {
    if (interaction.replied || interaction.deferred) {
        return; 
    }
    
    const modal = new ModalBuilder()
        .setCustomId('modal_tutorial_nombre')
        .setTitle('🧙‍♂️ ¿Cómo te llamas?');

    const nombreInput = new TextInputBuilder()
        .setCustomId('nombre_personaje')
        .setLabel('Tu Nombre')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Escribe tu nombre aquí...')
        .setRequired(true)
        .setMaxLength(20);

    modal.addComponents(new ActionRowBuilder().addComponents(nombreInput));
    await interaction.showModal(modal);
}

async function procesarNombre(interaction) {
    const nombre = interaction.fields.getTextInputValue('nombre_personaje');
    
    let userData = datosPersonaje.get(interaction.user.id) || {};
    userData.nombre = nombre;
    datosPersonaje.set(interaction.user.id, userData);
    guardarEstado();

    await mostrarSeleccionGenero(interaction, nombre);
}

async function mostrarSeleccionGenero(interaction, nombre) {
    const emojiSabio = '🧙‍♂️';
    
    const mensaje = generarMensajeEmbed({
        titulo: `${emojiSabio} **Identidad**`,
        descripcion: `**ElSabio:** Ah, **${nombre}**... un nombre con fuerza.\n\n` +
            `*ElSabio asiente lentamente mientras anota en su gran libro.*\n\n` +
            `**Para completar mi registro, necesito saber... ¿Cuál es tu género?**`,
        imagen: 'attachment://Tutorial_Sabio-1920x1080.png',
        banner: true,
        footer: `${emojiSabio} ElSabio • Género`,
        botones: [
            { id: 'genero_masculino', label: 'Masculino', style: ButtonStyle.Primary, emoji: '🚹' },
            { id: 'genero_femenino', label: 'Femenino', style: ButtonStyle.Primary, emoji: '🚺' }
        ]
    });
    
    mensaje.files = [{ attachment: PATHS.SABIO_BANNER, name: 'Tutorial_Sabio-1920x1080.png' }];
    
    await interaction.reply(mensaje);
}

async function procesarGenero(interaction) {
    console.log(`[DEBUG] procesarGenero - User: ${interaction.user.id}, CustomID: ${interaction.customId}`);
    try {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
        const genero = interaction.customId === 'genero_masculino' ? 'Masculino' : 'Femenino';
        
        let userData = datosPersonaje.get(interaction.user.id);
        
        // Intento de recuperación de estado por si hubo reinicio
        if (!userData) {
            console.log('[DEBUG] Memoria vacía, intentando recargar desde disco...');
            const loadedData = loadTutorialState();
            userData = loadedData.get(interaction.user.id);
            if (userData) {
                // Restaurar en memoria global
                loadedData.forEach((v, k) => datosPersonaje.set(k, v));
                console.log('[DEBUG] Datos recuperados del disco exitosamente.');
            }
        }

        if (!userData) {
            console.warn(`[WARN] No userData found for ${interaction.user.id} in procesarGenero`);
            await interaction.reply({ content: '⚠️ Sesión expirada o datos perdidos. Por favor, usa `/passquirkrpg` para reiniciar el tutorial desde cero.', ephemeral: true });
            return;
        }

        userData.genero = genero;
        userData.estado = ESTADOS.ELIGIENDO_RAZA; // Siguiente paso: Raza
        datosPersonaje.set(interaction.user.id, userData);
        guardarEstado();
        
        console.log(`[DEBUG] Género guardado: ${genero}. Pasando a Raza.`);
        // Pasar al siguiente paso: Raza
        await mostrarSeleccionRaza(interaction);
    } catch (error) {
        console.error('[ERROR] procesarGenero failed:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Error interno al procesar género.', ephemeral: true });
        }
    }
}

// --- SELECCIÓN DE RAZA (NUEVO) ---
async function mostrarSeleccionRaza(interaction) {
    const userData = datosPersonaje.get(interaction.user.id);
    const emojiSabio = '🧙‍♂️';
    
    const mensaje = generarMensajeEmbed({
        titulo: `${emojiSabio} **Elige tu Raza**`,
        descripcion: `**ElSabio:** Entendido. Ahora, háblame de tu origen.\n\n` +
            `*En este mundo conviven muchas especies. ¿A cuál perteneces tú?*\n\n` +
            `*Selecciona una opción para ver más detalles.*`,
        imagen: 'attachment://Tutorial_Sabio-1920x1080.png',
        banner: true,
        footer: `${emojiSabio} ElSabio • Selección de Raza`,
        botones: []
    });

    // Botones de Razas
    const row = new ActionRowBuilder();
    for (const [key, raza] of Object.entries(RAZAS_OFICIALES)) {
        // Parsear emoji ID si es custom (<:name:id>)
        let emoji = raza.emoji;
        if (emoji && emoji.startsWith('<:')) {
            emoji = emoji.split(':')[2].replace('>','');
        }

        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`raza_${key}`)
                .setLabel(raza.name)
                .setEmoji(emoji)
                .setStyle(ButtonStyle.Secondary)
        );
    }
    
    mensaje.components = [row];
    mensaje.files = [{ attachment: PATHS.SABIO_BANNER, name: 'Tutorial_Sabio-1920x1080.png' }];
    
    if (interaction.replied || interaction.deferred) await interaction.editReply(mensaje);
    else await interaction.update(mensaje);
}

async function procesarRaza(interaction) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
    const razaId = interaction.customId.replace('raza_', '');
    await mostrarDetalleRaza(interaction, razaId);
}

async function mostrarDetalleRaza(interaction, razaId) {
    const razaData = RAZAS_OFICIALES[razaId];
    if (!razaData) return interaction.reply({ content: '❌ Error: Raza no encontrada.', ephemeral: true });

    const emojiSabio = '🧙‍♂️';
    
    // Obtener imagen local de la raza
    // passquirk-official-data.js tiene paths absolutos ahora, necesitamos extraer nombre archivo
    // para adjuntar y referenciar
    const imagePath = razaData.image; // e:\PassQuirk\...
    const originalName = imagePath.split('\\').pop(); // "Humanos - Razas - PassQuirk.png"
    // Sanitize filename for Discord attachment (remove spaces, special chars)
    const imageName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_'); 

    const mensaje = generarMensajeEmbed({
        titulo: `${razaData.emoji} **Raza: ${razaData.name}**`,
        descripcion: `**${razaData.description}**\n\n` +
            `**💎 Bonificaciones:**\n` +
            razaData.bonuses.map(b => `• ${b}`).join('\n') + `\n\n` +
            `*¿Es esta tu verdadera naturaleza?*`,
        imagen: `attachment://${imageName}`,
        thumbnail: `attachment://${imageName}`, 
        banner: false, 
        footer: `${emojiSabio} ElSabio • Detalle de Raza`,
        botones: [
            { id: `confirmar_raza_${razaId}`, label: '¡Elegir!', style: ButtonStyle.Success, emoji: '✅' },
            { id: 'volver_raza', label: 'Atrás', style: ButtonStyle.Secondary, emoji: '↩️' }
        ]
    });
    
    mensaje.files = [{ attachment: imagePath, name: imageName }];
    
    if (interaction.replied || interaction.deferred) await interaction.editReply(mensaje);
    else await interaction.update(mensaje);
}

async function confirmarRaza(interaction) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
    const razaId = interaction.customId.replace('confirmar_raza_', '');
    const razaData = RAZAS_OFICIALES[razaId];
    
    let userData = getUserDataSafe(interaction.user.id);
    if (!userData) {
        // Recuperación de emergencia si se perdió la sesión
        userData = { 
            nombre: interaction.user.username, 
            genero: 'No especificado',
            estado: ESTADOS.ELIGIENDO_RAZA 
        };
    }

    userData.raza = razaData;
    userData.razaId = razaId;
    userData.estado = ESTADOS.ELIGIENDO_ASPECTO; // Correcto: siguiente paso es Aspecto
    datosPersonaje.set(interaction.user.id, userData);
    guardarEstado();
    
    await mostrarMensajeAspecto(interaction);
}

// --- ASPECTO ---
async function mostrarMensajeAspecto(interaction) {
    const userData = getUserDataSafe(interaction.user.id);
    const razaNombre = userData && userData.raza ? userData.raza.name : 'Viajero';
    const emojiSabio = '🧙‍♂️';
    
    const mensaje = generarMensajeEmbed({
        titulo: `${emojiSabio} **Tu Apariencia**`,
        descripcion: `**ElSabio:** ¡Así que eres de los **${razaNombre}**! Interesante elección...\n\n` +
            `Ahora dime... **¿Cómo es tu apariencia? ¿Tienes alguna imagen que te represente?**`,
        imagen: 'attachment://Tutorial_Sabio-1920x1080.png',
        banner: true,
        footer: `${emojiSabio} ElSabio • Creación de Personaje`,
        botones: [
            { id: 'tutorial_step_aspecto', label: 'Describir Aspecto', style: ButtonStyle.Primary, emoji: '🖼️' }
        ]
    });
    
    mensaje.files = [{ attachment: PATHS.SABIO_BANNER, name: 'Tutorial_Sabio-1920x1080.png' }];
    
    if (interaction.replied || interaction.deferred) await interaction.editReply(mensaje);
    else await interaction.update(mensaje);
}

async function mostrarModalAspecto(interaction) {
    const emojiCamara = '📷';
    const emojiLink = '🔗';
    const emojiSabio = '🧙‍♂️';
    
    const mensaje = generarMensajeEmbed({
        titulo: `${emojiSabio} **Tu Apariencia**`,
        descripcion: `**ElSabio:** ¿Cómo quieres mostrar tu apariencia?\n\n` +
            `Puedes subir una imagen directamente desde tu dispositivo o usar un enlace.\n` +
            `*La imagen es el reflejo del alma...*`,
        imagen: 'attachment://Tutorial_Sabio-1920x1080.png',
        banner: true,
        footer: `${emojiSabio} ElSabio • Aspecto`,
        botones: [
            { id: 'tutorial_aspecto_subir', label: 'Subir Imagen', style: ButtonStyle.Primary, emoji: emojiCamara },
            { id: 'tutorial_aspecto_url', label: 'Usar URL', style: ButtonStyle.Secondary, emoji: emojiLink }
        ]
    });
    
    mensaje.files = [{ attachment: PATHS.SABIO_BANNER, name: 'Tutorial_Sabio-1920x1080.png' }];

    if (interaction.replied || interaction.deferred) await interaction.editReply(mensaje);
    else await interaction.reply(mensaje);
}

const axios = require('axios');

// Nueva función para manejar la subida de imágenes por mensaje
async function solicitarImagenPorMensaje(interaction) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

    const emojiCamara = '📷';
    const mensaje = generarMensajeEmbed({
        titulo: `${emojiCamara} **Sube tu Imagen**`,
        descripcion: `Por favor, envía tu imagen en este canal ahora.\n` +
            `Acepto formatos **JPG, PNG o GIF**.\n` +
            `*Tienes 10 minutos.*`,
        footer: 'Esperando imagen...',
        color: COLORES.INFO
    });

    await interaction.editReply(mensaje);

    const filter = m => m.author.id === interaction.user.id && m.attachments.size > 0;
    const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 600000 });

    collector.on('collect', async m => {
        const attachment = m.attachments.first();
        const imageUrl = attachment.url;
        let finalUrl = imageUrl;
        
        // Intentar subir a Supabase para persistencia
        try {
            const playerDB = getPlayerDB(interaction);
            if (playerDB && process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
                await interaction.followUp({ content: '⏳ Procesando imagen...', ephemeral: true });
                const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data, 'binary');
                const filename = attachment.name || `avatar_${Date.now()}.png`;
                const mimeType = attachment.contentType || 'image/png';
                
                finalUrl = await playerDB.uploadUserAvatar(interaction.user.id, buffer, filename, mimeType);
            }
        } catch (error) {
            console.error('Error subiendo imagen a Supabase:', error);
            // Fallback a URL de Discord (advertir expiración)
        }

        // Guardar URL
        let userData = getUserDataSafe(interaction.user.id);
        userData.imagenUrl = finalUrl;
        datosPersonaje.set(interaction.user.id, userData);
        
        // Borrar mensaje del usuario para limpieza (opcional)
        // NOTA: Si falló la subida a Supabase, borrar el mensaje romperá la URL de Discord eventualmente.
        // Por seguridad, solo borramos si tenemos URL de Supabase, o aceptamos el riesgo.
        // Para este caso, mejor NO borrar el mensaje si usamos la URL original.
        if (finalUrl !== imageUrl) {
             try { await m.delete(); } catch (e) {}
        }

        // Avanzar
        await procesarAspecto(interaction); 
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            interaction.followUp({ content: '⏳ Tiempo agotado. Por favor intenta de nuevo o usa una URL.', ephemeral: true });
        }
    });
}

async function mostrarModalAspectoUrl(interaction) {
    const modal = new ModalBuilder().setCustomId('modal_tutorial_aspecto').setTitle('🧙‍♂️ Tu Apariencia');
    const historiaInput = new TextInputBuilder().setCustomId('historia_personaje').setLabel('Breve Historia').setStyle(TextInputStyle.Paragraph).setRequired(false);
    const imagenInput = new TextInputBuilder().setCustomId('imagen_personaje').setLabel('URL de Imagen (Opcional)').setStyle(TextInputStyle.Short).setRequired(false);
    
    modal.addComponents(new ActionRowBuilder().addComponents(historiaInput), new ActionRowBuilder().addComponents(imagenInput));
    await interaction.showModal(modal);
}

async function procesarAspecto(interaction) {
    let userData = getUserDataSafe(interaction.user.id) || { nombre: interaction.user.username, genero: 'No especificado' };
    
    if (interaction.isModalSubmit && interaction.isModalSubmit()) {
        try { userData.historia = interaction.fields.getTextInputValue('historia_personaje'); } catch (e) {}
        try { userData.imagenUrl = interaction.fields.getTextInputValue('imagen_personaje'); } catch (e) {}
    }
    
    if (!userData.historia) userData.historia = 'Sin historia específica';
    userData.estado = ESTADOS.ELIGIENDO_CLASE;
    datosPersonaje.set(interaction.user.id, userData);
    guardarEstado();

    const emojiSabio = '🧙‍♂️';
    const imagenFinal = userData.imagenUrl || 'attachment://Tutorial_Sabio-1920x1080.png';
    
    const mensaje = generarMensajeEmbed({
        titulo: `${emojiSabio} **Ficha de Personaje**`,
        descripcion: `**ElSabio:** ¡Perfecto! Ya tengo todo lo necesario para tu registro inicial.\n\n` +
            `**📋 Datos Registrados:**\n` +
            `**· Nombre:** ${userData.nombre}\n` +
            `**· Género:** ${userData.genero}\n` +
            `**· Raza:** ${userData.raza ? userData.raza.emoji + ' ' + userData.raza.name : 'Desconocida'}\n` +
            `**· Historia:** ${userData.historia}\n` +
            (userData.imagenUrl ? `**· Imagen:** [Ver Imagen](${userData.imagenUrl})\n` : '') +
            `\n**¿Es todo correcto? Si es así, procederemos a despertar tu poder interior (Clase).**`,
        imagen: imagenFinal,
        banner: true,
        footer: `${emojiSabio} ElSabio • Confirmación`,
        botones: [
            { id: 'tutorial_confirmar_ficha', label: 'Confirmar y Elegir Clase', style: ButtonStyle.Success, emoji: '✅' },
            { id: 'tutorial_step_nombre', label: 'Reiniciar Registro', style: ButtonStyle.Secondary, emoji: '🔄' }
        ]
    });
    
    mensaje.files = [];
    if (!userData.imagenUrl) mensaje.files.push({ attachment: PATHS.SABIO_BANNER, name: 'Tutorial_Sabio-1920x1080.png' });

    if (interaction.replied || interaction.deferred) await interaction.editReply(mensaje);
    else await interaction.reply(mensaje);
}

// --- CLASE ---
async function mostrarSeleccionClase(interaction) {
    const userData = getUserDataSafe(interaction.user.id);
    const emojiSabio = '🧙‍♂️';
    const emojiEstrella = getEmoji('starGold', '⭐');
    
    const mensaje = generarMensajeEmbed({
        titulo: `${emojiSabio} **Elige tu Clase**`,
        descripcion: `**ElSabio:** ¡Excelente, ${userData.nombre}! Ahora debes elegir una clase para tu personaje.\n\n` +
            `${emojiEstrella} ***Toca una clase para ver sus detalles:***\n` +
            `*Cada clase tiene un rol y habilidades únicas.*\n` +
            `\n\n*Elige sabiamente, esta decisión definirá tu camino...*`,
        imagen: 'attachment://Tutorial_Sabio-1920x1080.png',
        banner: true,
        footer: `${emojiSabio} ElSabio • Selección de Clase`,
        botones: []
    });
    
    // Botones de Clases
    const row1 = new ActionRowBuilder();
    const row2 = new ActionRowBuilder();
    let count = 0;
    for (const [key, clase] of Object.entries(CLASES_OFICIALES)) {
        // Parsear emoji ID si es custom
        let emoji = clase.emoji;
        if (emoji.startsWith('<:')) {
            emoji = emoji.split(':')[2].replace('>','');
        }

        const btn = new ButtonBuilder()
            .setCustomId(`clase_${key}`)
            .setLabel(clase.name)
            .setEmoji(emoji)
            .setStyle(ButtonStyle.Primary);
        
        if (count < 4) row1.addComponents(btn);
        else row2.addComponents(btn);
        count++;
    }
    
    mensaje.components = [row1];
    if (row2.components.length > 0) mensaje.components.push(row2);
    
    mensaje.files = [{ attachment: PATHS.SABIO_BANNER, name: 'Tutorial_Sabio-1920x1080.png' }];
    
    if (interaction.replied || interaction.deferred) await interaction.editReply(mensaje);
    else await interaction.update(mensaje);
}

async function procesarClase(interaction) {
    try {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
    } catch (e) {}
    
    const claseId = interaction.customId.replace('clase_', '');
    const claseData = CLASES_OFICIALES[claseId];
    
    // Guardar temporalmente
    let userData = getUserDataSafe(interaction.user.id);
    userData.claseTemp = claseData;
    userData.claseIdTemp = claseId;
    datosPersonaje.set(interaction.user.id, userData);
    
    await mostrarDetalleClase(interaction, claseId);
}

async function confirmarClase(interaction) {
    try {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
    } catch (e) {}

    let userData = getUserDataSafe(interaction.user.id);
    const claseId = interaction.customId.replace('confirmar_clase_', '');
    const claseData = CLASES_OFICIALES[claseId];

    // Guardar selección
    userData.clase = claseData;
    userData.claseId = claseId;
    userData.estado = ESTADOS.ELIGIENDO_REINO; // Avanzar estado
    
    // Calcular stats iniciales
    const { calculateStats } = require('../../utils/statsCalculator');
    const stats = calculateStats(userData.razaId, claseId, 1);
    userData.stats = stats;
    userData.hp = stats.maxHp;
    userData.mp = stats.maxMp;

    datosPersonaje.set(interaction.user.id, userData);
    guardarEstado();

    await mostrarSeleccionReino(interaction);
}

async function mostrarDetalleClase(interaction, claseId) {
    const claseData = CLASES_OFICIALES[claseId];
    const emojiSabio = '🧙‍♂️';
    
    // Preparar descripción detallada
    let statsInfo = '';
    if (claseData.baseStats) {
        statsInfo += `\n**📊 Estadísticas Base:**\n` +
            `❤️ HP: ${claseData.baseStats.hp} | 💧 MP: ${claseData.baseStats.mp}\n` +
            `⚔️ ATK: ${claseData.baseStats.attack} | 🛡️ DEF: ${claseData.baseStats.defense} | 💨 SPD: ${claseData.baseStats.speed}`;
    }
    
    let habilidadesInfo = '';
    if (claseData.abilities) {
        habilidadesInfo += `\n\n**✨ Habilidades Iniciales:**\n`;
        if (claseData.abilities.basic) habilidadesInfo += `${claseData.abilities.basic.emoji || '🔸'} **${claseData.abilities.basic.name}**: ${claseData.abilities.basic.damage}\n`;
        if (claseData.abilities.power) habilidadesInfo += `${claseData.abilities.power.emoji || '🔹'} **${claseData.abilities.power.name}**: ${claseData.abilities.power.damage}\n`;
        if (claseData.abilities.special) habilidadesInfo += `${claseData.abilities.special.emoji || '💥'} **${claseData.abilities.special.name}**: ${claseData.abilities.special.damage}\n`;
    }

    const mensaje = generarMensajeEmbed({
        titulo: `${claseData.emoji} **Clase: ${claseData.name}**`,
        descripcion: `**Rol:** ${claseData.role || 'Aventurero'}\n` +
            `**Estilo:** ${claseData.style || 'Equilibrado'}\n\n` +
            `**${claseData.description}**\n` +
            statsInfo + 
            habilidadesInfo +
            `\n\n${emojiSabio} **ElSabio:** ¿Es este el camino que deseas tomar?`,
        imagen: claseData.image, // URL directa desde Supabase
        banner: true,
        footer: `Clase ${claseData.name} • Confirmación`,
        botones: [
            { id: `confirmar_clase_${claseId}`, label: '¡Elegir!', style: ButtonStyle.Success, emoji: '✅' },
            { id: 'volver_seleccion_clase', label: 'Atrás', style: ButtonStyle.Secondary, emoji: '↩️' }
        ]
    });
    
    // Si la imagen es URL, no la adjuntamos como file, Discord la carga sola si está en image.url
    // Si es path local, necesitamos adjuntarla. ASSETS.classes son URLs en passquirk-official-data.js
    mensaje.files = []; 
    
    if (interaction.replied || interaction.deferred) await interaction.editReply(mensaje);
    else await interaction.update(mensaje);
}

async function confirmarClase(interaction) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
    const claseId = interaction.customId.replace('confirmar_clase_', '');
    const claseData = CLASES_OFICIALES[claseId];
    
    let userData = getUserDataSafe(interaction.user.id);
    
    // Confirmar selección
    userData.clase = claseData;
    userData.claseId = claseId;
    delete userData.claseTemp;
    delete userData.claseIdTemp;
    
    // Calcular estadísticas finales con multiplicadores raciales
    const razaData = RACES[userData.razaId.toUpperCase()] || userData.raza; // Asegurar acceso a data oficial
    
    // Usar el calculador centralizado para consistencia (Nivel 1)
    const statsCalculados = calculateStats(claseData.baseStats, userData.razaId, 1);

    userData.stats = {
        hp: statsCalculados.hp,
        mp: statsCalculados.mp,
        attack: statsCalculados.attack,
        defense: statsCalculados.defense,
        speed: statsCalculados.speed
    };

    datosPersonaje.set(interaction.user.id, userData);
    guardarEstado();
    
    await mostrarStatsIniciales(interaction);
}

async function mostrarStatsIniciales(interaction) {
    const userData = datosPersonaje.get(interaction.user.id);
    const claseData = userData.clase;
    const razaData = RACES[userData.razaId.toUpperCase()];
    const emojiSabio = '🧙‍♂️';
    
    const base = claseData.baseStats;
    const final = userData.stats;
    const mult = razaData.multipliers;

    // Helper para mostrar bono (e.g., "+10%")
    const showBonus = (m) => {
        if (!m || m === 1) return '';
        const pct = Math.round((m - 1) * 100);
        return pct > 0 ? ` (+${pct}%)` : ` (${pct}%)`;
    };

    const mensaje = generarMensajeEmbed({
        titulo: `📈 **Tus Estadísticas Iniciales**`,
        descripcion: `${emojiSabio} **ElSabio:** Una elección poderosa, **${userData.nombre}**.\n` +
            `Como **${claseData.name}** de raza **${razaData.name}**, tus capacidades se potencian:\n\n` +
            `❤️ **Vida (HP):** ${final.hp} \`Base ${base.hp}${showBonus(mult.hp)}\`\n` +
            `💧 **Maná (MP):** ${final.mp} \`Base ${base.mp}${showBonus(mult.mp)}\`\n` +
            `⚔️ **Ataque:** ${final.attack} \`Base ${base.attack}${showBonus(mult.attack)}\`\n` +
            `🛡️ **Defensa:** ${final.defense} \`Base ${base.defense}${showBonus(mult.defense)}\`\n` +
            `💨 **Velocidad:** ${final.speed} \`Base ${base.speed}${showBonus(mult.speed)}\`\n\n` +
            `*Estas estadísticas crecerán a medida que subas de nivel y mejores tu equipamiento.*\n` +
            `*¿Estás listo para continuar?*`,
        imagen: claseData.statsImage || 'attachment://Tutorial_Sabio-1920x1080.png',
        banner: true,
        footer: `${emojiSabio} ElSabio • Estadísticas`,
        botones: [
            { id: 'continuar_a_reino', label: 'Continuar', style: ButtonStyle.Primary, emoji: '➡️' }
        ]
    });
    
    if (claseData.statsImage) {
        mensaje.files = [];
    } else {
        mensaje.files = [{ attachment: PATHS.SABIO_BANNER, name: 'Tutorial_Sabio-1920x1080.png' }];
    }

    if (interaction.replied || interaction.deferred) await interaction.editReply(mensaje);
    else await interaction.update(mensaje);
}

async function mostrarSeleccionReino(interaction) {
    const emojiSabio = '🧙‍♂️';
    const mensaje = generarMensajeEmbed({
        titulo: `${emojiSabio} **Elige tu Reino de Origen**`,
        descripcion: `**ElSabio:** Has elegido el camino de **${datosPersonaje.get(interaction.user.id).clase.name}**.\n` +
            `Ahora, dime... ¿De qué tierras provienes?\n\n` +
            `*Elige tu reino de origen:*`,
        imagen: 'attachment://Tutorial_Sabio-1920x1080.png',
        banner: true,
        footer: `${emojiSabio} ElSabio • Selección de Reino`,
        botones: [] // Usaremos SelectMenu
    });
    
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('tutorial_reino_select')
        .setPlaceholder('Selecciona tu Reino')
        .addOptions(
            Object.entries(REINOS_OFICIALES).map(([key, reino]) => ({
                label: reino.name,
                description: reino.desc,
                value: key,
                emoji: reino.emoji
            }))
        );
        
    mensaje.components = [new ActionRowBuilder().addComponents(selectMenu)];
    mensaje.files = [{ attachment: PATHS.SABIO_BANNER, name: 'Tutorial_Sabio-1920x1080.png' }];
    
    if (interaction.replied || interaction.deferred) await interaction.editReply(mensaje);
    else await interaction.update(mensaje);
}

async function seleccionarReino(interaction) {
    const reinoId = interaction.values[0];
    const reinoData = REINOS_OFICIALES[reinoId];
    let userData = datosPersonaje.get(interaction.user.id);
    
    userData.reino = reinoData;
    userData.reinoId = reinoId;
    userData.estado = ESTADOS.COMBATE_TUTORIAL;
    datosPersonaje.set(interaction.user.id, userData);
    guardarEstado();
    
    // Resumen y Combate
    const emojiSabio = '🧙‍♂️';
    const mensaje = generarMensajeEmbed({
        titulo: `⚔️ **¡Personaje Completado!**`,
        descripcion: `**ElSabio:** ¡Perfecto, ${userData.nombre}! Tu personaje está listo.\n\n` +
            `***Resumen Final:***\n` +
            `**Nombre:** ${userData.nombre}\n` +
            `**Clase:** ${userData.clase.emoji} ${userData.clase.name}\n` +
            `**Raza:** ${userData.raza ? userData.raza.emoji + ' ' + userData.raza.name : 'Desconocida'}\n` +
            `**Reino:** ${reinoData.emoji} ${reinoData.name}\n` +
            `**Género:** ${userData.genero}\n\n` +
            `**ElSabio:** Ahora es momento de aprender lo básico del combate. Te enfrentarás a un **Slime Verde** 🧪.\n` +
            `*¿Estás listo?*`,
        imagen: 'attachment://Tutorial_Sabio-1920x1080.png',
        banner: true,
        color: COLORES.VERDE_EXITO,
        footer: `⚔️ PassQuirk RPG • Tutorial de Combate`,
        botones: [{ id: 'iniciar_combate_tutorial', label: 'Iniciar Combate', style: ButtonStyle.Danger, emoji: '⚔️' }]
    });
    
    mensaje.files = [{ attachment: PATHS.SABIO_BANNER, name: 'Tutorial_Sabio-1920x1080.png' }];
    
    if (interaction.replied || interaction.deferred) await interaction.editReply(mensaje);
    else await interaction.update(mensaje);
}

async function iniciarCombateTutorial(interaction) {
    let userData = datosPersonaje.get(interaction.user.id);
    // Recuperar de archivo si es necesario
    if (!userData) {
        const loadedData = loadTutorialState();
        userData = loadedData.get(interaction.user.id);
        if (userData) datosPersonaje.set(interaction.user.id, userData);
    }

    if (!userData) {
         await interaction.reply({ content: '❌ Error crítico: Datos de personaje perdidos.', ephemeral: true });
         return;
    }

    // Música de Combate
    if (musicManager) {
        try {
            const member = await interaction.guild.members.fetch(interaction.user.id);
            if (member.voice.channel) musicManager.playFile(VARIABLES_MUSICA.COMBATE.file, VARIABLES_MUSICA.COMBATE.loop);
        } catch (e) {
            console.log('[DEBUG] No se pudo reproducir música de combate (Usuario no en voz o error):', e.message);
        }
    }

    userData.estado = ESTADOS.COMBATE_TUTORIAL;
    guardarEstado();

    // Inicializar estado de combate
    const hpInicial = userData.clase.baseStats.hp;
    estadosCombate.set(interaction.user.id, {
        playerHp: hpInicial,
        playerMaxHp: hpInicial,
        playerMp: userData.clase.baseStats.mp,
        playerMaxMp: userData.clase.baseStats.mp,
        enemyName: 'Slime de Prueba',
        enemyHp: 30,
        enemyMaxHp: 30,
        turn: 1,
        log: [],
        quirkAleatorio: null // Se generará al ganar
    });

    const embedCombate = new EmbedBuilder()
        .setColor('#e53e3e') // Color rojo directo en hex para evitar problemas de validación
        .setTitle('⚔️ ¡COMBATE INICIADO!')
        .setDescription(`
        Un **Slime de Prueba** ha aparecido.
        ¡Es hora de demostrar tu valía, **${userData.nombre}**!
        
        **Tu Vida:** ${hpInicial} / ${hpInicial} ❤️
        **Tu Energía:** ${userData.clase.baseStats.mp} / ${userData.clase.baseStats.mp} ⚡
        
        **Enemigo:** Slime de Prueba
        **Vida:** 30 / 30 ❤️
        `)
        .setImage('attachment://SlimeTutorial_Nvl1.png'); // Placeholder

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('combate_atacar').setLabel('Atacar').setStyle(ButtonStyle.Danger).setEmoji('⚔️'),
        new ButtonBuilder().setCustomId('combate_defender').setLabel('Defender').setStyle(ButtonStyle.Primary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('combate_habilidad').setLabel('Habilidad').setStyle(ButtonStyle.Secondary).setEmoji('✨')
    );
    
    const files = [];
    if (fs.existsSync(PATHS.SLIME_IMG)) {
        files.push({ attachment: PATHS.SLIME_IMG, name: 'SlimeTutorial_Nvl1.png' });
    } else {
        embedCombate.setImage(null);
    }

    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [embedCombate], components: [row], files: files });
    } else {
        await interaction.update({ embeds: [embedCombate], components: [row], files: files });
    }
}

async function procesarTurnoCombate(interaction) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
    const accion = interaction.customId.replace('combate_', '');
    const estado = estadosCombate.get(interaction.user.id);
    
    if (!estado) return interaction.reply({ content: '❌ Error: Combate no encontrado.', ephemeral: true });
    
    let log = '';
    let danoEnemigo = Math.floor(Math.random() * 15) + 10;
    
    if (accion === 'atacar') {
        const danoJugador = Math.floor(Math.random() * 20) + 15;
        estado.enemyHp = Math.max(0, estado.enemyHp - danoJugador);
        log = `⚔️ **¡Atacaste al Slime!** Daño: **${danoJugador}**.\n`;
    } else if (accion === 'defender') {
        danoEnemigo = Math.floor(danoEnemigo / 2);
        log = `🛡️ **¡Te defendiste!** Reduces el daño.\n`;
    } else if (accion === 'habilidad') {
        // Simple habilidad para el tutorial
        if (estado.playerMp >= 20) {
             const danoHabilidad = Math.floor(Math.random() * 30) + 20;
             estado.enemyHp = Math.max(0, estado.enemyHp - danoHabilidad);
             estado.playerMp -= 20;
             log = `✨ **¡Usaste Habilidad!** Daño masivo: **${danoHabilidad}**.\n`;
        } else {
             log = `⚠️ **¡Sin energía!** No pudiste usar tu habilidad.\n`;
        }
    }

    if (estado.enemyHp > 0) {
        estado.playerHp = Math.max(0, estado.playerHp - danoEnemigo);
        log += `🧪 **Slime ataca!** Daño: **${danoEnemigo}**.\n`;
    }
    
    estado.turn++;
    
    if (estado.enemyHp <= 0) {
        await mostrarAtaqueFinal(interaction);
    } else if (estado.playerHp <= 0) {
        await mostrarDerrota(interaction);
    } else {
        await actualizarCombate(interaction, log, null);
    }
}

async function actualizarCombate(interaction, log, files) {
    const estado = estadosCombate.get(interaction.user.id);
    const embedCombate = new EmbedBuilder()
        .setColor(COLORES.ROJO_PELIGRO)
        .setTitle(`⚔️ **Combate Tutorial - Turno ${estado.turn}**`)
        .setDescription(`${log}\n\n` +
            `**Tu Vida:** ${estado.playerHp} / ${estado.playerMaxHp} ❤️\n` +
            `**Tu Energía:** ${estado.playerMp} / ${estado.playerMaxMp} ⚡\n\n` +
            `**Slime de Prueba:** ${estado.enemyHp} / ${estado.enemyMaxHp} ❤️\n\n` +
            `**Tu turno - Elige tu acción:**`
        )
        .setImage('attachment://SlimeTutorial_Nvl1.png')
        .setFooter({ text: '⚔️ Combate Tutorial' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('combate_atacar').setLabel('Atacar').setStyle(ButtonStyle.Danger).setEmoji('⚔️'),
        new ButtonBuilder().setCustomId('combate_defender').setLabel('Defender').setStyle(ButtonStyle.Primary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('combate_habilidad').setLabel('Habilidad').setStyle(ButtonStyle.Secondary).setEmoji('✨').setDisabled(estado.playerMp < 20)
    );
    
    const filesArr = [];
    if (fs.existsSync(PATHS.SLIME_IMG)) {
        filesArr.push({ attachment: PATHS.SLIME_IMG, name: 'SlimeTutorial_Nvl1.png' });
    } else {
        embedCombate.setImage(null);
    }
    
    if (interaction.replied || interaction.deferred) await interaction.editReply({ embeds: [embedCombate], components: [row], files: filesArr });
    else await interaction.update({ embeds: [embedCombate], components: [row], files: filesArr });
}

async function mostrarAtaqueFinal(interaction) {
    const mensaje = generarMensajeEmbed({
        titulo: `🎉 **¡El Slime está debilitado!**`,
        descripcion: `💥 **¡Es momento del ATAQUE FINAL!**\nUsa tu movimiento especial para terminar el combate.`,
        color: COLORES.VERDE_EXITO,
        footer: `💥 Ataque Final Disponible`,
        botones: [{ id: 'combate_ataque_final', label: '💥 ATAQUE FINAL', emoji: '💥', style: ButtonStyle.Danger }]
    });
    
    if (interaction.replied || interaction.deferred) await interaction.editReply(mensaje);
    else await interaction.update(mensaje);
}

async function ataqueFinalizador(interaction) {
    // Corregir error de doble respuesta: usar deferUpdate si no se ha diferido,
    // pero si ya se ha respondido, usar editReply o followUp.
    // La función generarMensajeEmbed devuelve un objeto de opciones para reply/update.
    
    try {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
    } catch (e) {
        console.log('Error deferring update in ataqueFinalizador (ignorable):', e.message);
    }

    const userData = datosPersonaje.get(interaction.user.id);
    const emojiSabio = '🧙‍♂️';
    
    const mensaje = generarMensajeEmbed({
        titulo: `🎉 **¡VICTORIA!**`,
        descripcion: `💥 **¡Has derrotado al Slime Verde!**\n\n` +
            `${emojiSabio} **ElSabio:** ¡Excelente, ${userData.nombre}! Has demostrado gran habilidad.\n\n` +
            `**ElSabio:** Tu aventura comienza ahora desde **Space Central**, la ciudad base del universo PassQuirk.\n` +
            `*¡Has completado el tutorial!*`,
        imagen: 'attachment://Tutorial_Sabio-1920x1080.png',
        banner: true,
        color: COLORES.VERDE_EXITO,
        footer: `🎉 PassQuirk RPG • Tutorial Completado`,
        botones: [{ id: 'ir_intro_space_central', label: 'Continuar a Space Central', emoji: '🌟', style: ButtonStyle.Success }]
    });
    
    mensaje.files = [{ attachment: PATHS.SABIO_BANNER, name: 'Tutorial_Sabio-1920x1080.png' }];
    
    // Usar editReply siempre es más seguro si ya hicimos deferUpdate
    await interaction.editReply(mensaje);
}

async function completarTutorial(interaction) {
    let userData = datosPersonaje.get(interaction.user.id);
    // Recuperación de emergencia
    if (!userData) {
        console.log('[DEBUG] Recuperando userData en completarTutorial...');
        const loadedData = loadTutorialState();
        userData = loadedData.get(interaction.user.id);
        if (userData) loadedData.forEach((v, k) => datosPersonaje.set(k, v));
    }

    const estadoCombate = estadosCombate.get(interaction.user.id);
    
    if (!userData || !estadoCombate) {
        console.error('Datos incompletos al completar tutorial:', { userData: !!userData, estadoCombate: !!estadoCombate });
        await interaction.reply({ content: '❌ Error: Datos de tutorial perdidos. Por favor reinicia con /passquirkrpg.', ephemeral: true });
        return;
    }

    // Construir objeto de jugador completo
    // Obtener stats finales (ya calculados o calcularlos ahora)
    const finalStats = userData.stats || calculateStats(userData.clase.baseStats, userData.razaId || 'HUMANOS', 1);

    const { BASE_CLASSES } = require('../../data/passquirk-official-data');

    // Normalizar clase a clave oficial
    let classKey = userData.claseId;
    if (classKey) {
        const normalized = String(classKey).toLowerCase();
        const match = Object.keys(BASE_CLASSES).find(k => k.toLowerCase() === normalized || k.toLowerCase().replace(/\s+/g, '_') === normalized);
        if (match) classKey = match;
    }

    const newPlayer = {
        userId: interaction.user.id,
        username: userData.nombre || interaction.user.username,
        level: 1,
        experience: 0,
        nextLevelExp: 100,
        class: classKey,
        race: userData.razaId || 'HUMANOS', // Campo raza
        kingdom: userData.reinoId || 'akai', // Reino elegido
        gender: userData.genero || 'No especificado',
        profileIcon: userData.imagenUrl || null, // Guardar icono personalizado
        stats: {
            hp: finalStats.hp, maxHp: finalStats.hp,
            mp: finalStats.mp, maxMp: finalStats.mp,
            attack: finalStats.attack, defense: finalStats.defense, speed: finalStats.speed
        },
        realPower: 0,
        activities: { total: 0, today: 0, streak: 0, lastActivity: null, history: [] },
        inventory: { gold: 0, items: {}, equipment: { weapon: null, armor: null, accessory: null } },
        exploration: {
            currentZone: userData.reinoId || 'Space Central',
            unlockedZones: userData.reinoId ? [userData.reinoId, 'Space Central'] : ['Space Central'],
            progress: {}
        },
        quirks: estadoCombate.quirkAleatorio ? [{ ...estadoCombate.quirkAleatorio, acquiredAt: new Date().toISOString() }] : [],
        passquirk: null,
        titles: ['Novato'],
        createdAt: new Date().toISOString(),
        // Sistema de Misiones (Quest System)
        mission: {
             id: 'mision_tutorial_bosque',
             status: 'active',
             step: 'intro',
             description: 'Escucha a ElSabio en Space Central y prepárate para tu primera misión.'
        }
    };
    
        // Guardar en DB
    try {
        console.log('[DEBUG] Guardando nuevo jugador en Supabase:', {
            id: newPlayer.userId,
            username: newPlayer.username,
            class: newPlayer.class
        });

        const playerDB = getPlayerDB(interaction);
        const savedData = await playerDB.savePlayer(newPlayer);
        
        // Verificación inmediata (Ahora revisa caché/local también)
        const verify = await playerDB.getPlayer(newPlayer.userId);
        if (!verify) {
            console.error('❌ FATAL: Jugador guardado pero no encontrado en verificación inmediata.');
            throw new Error('Verificación de guardado fallida');
        }

        console.log(`✅ Jugador ${newPlayer.username} registrado y verificado correctamente.`);
    } catch (e) { 
        console.error('❌ Error CRÍTICO guardando player en completarTutorial:', e); 
        // Intento de guardado de emergencia en backup local explícito si no existe
        try {
             const playerDB = getPlayerDB(interaction);
             playerDB.players[newPlayer.userId] = newPlayer;
             playerDB.saveLocalBackup();
             console.log('✅ Recuperado mediante guardado de emergencia local.');
        } catch (ex) {
             console.error('❌ Fallo total de guardado:', ex);
        }
    }

    // Limpiar estado temporal
    datosPersonaje.delete(interaction.user.id);
    estadosCombate.delete(interaction.user.id);
    guardarEstado();

    // Ir a la INTRO de Space Central (Nuevo Flujo)
    await mostrarIntroSpaceCentral(interaction, newPlayer.username);
}

// Nueva función para el flujo post-tutorial UNIFICADO (Hub + Sabio)
async function mostrarSpaceCentral(interaction) {
    const cmd = interaction.client.commands.get('spacecentral');
    if (cmd && cmd.mostrarSpaceCentralUnificado) {
        // Delegate to the unified Space Central logic
        return cmd.mostrarSpaceCentralUnificado(interaction, interaction.client);
    }
    // Fallback (Should not happen if spacecentral.js is correct)
    console.error('❌ Fallback: spacecentral command not found or missing unified method.');
    await interaction.reply({ content: '❌ Error crítico cargando Space Central.', ephemeral: true });
}

// Alias para compatibilidad con llamadas anteriores
const mostrarIntroSpaceCentral = mostrarSpaceCentral;

async function mostrarMenuReinicio(interaction) {
    const mensaje = generarMensajeEmbed({
        titulo: `⭐ **Bienvenido de Nuevo**`,
        descripcion: `Ya tienes una aventura iniciada.\n¿Deseas continuar desde Space Central o reiniciar tu progreso?`,
        color: COLORES.AMARILLO_TUTORIAL,
        botones: [
            { id: 'ir_space_central', label: 'Continuar Aventura', style: ButtonStyle.Success, emoji: '🌟' },
            { id: 'reiniciar_tutorial_confirm', label: 'Reiniciar Todo', style: ButtonStyle.Danger, emoji: '⚠️' }
        ]
    });
    
    await interaction.reply({ embeds: mensaje.embeds, components: mensaje.components, ephemeral: true });
}

async function mostrarDerrota(interaction) {
    await interaction.update({ content: '💔 Has sido derrotado. Inténtalo de nuevo.', components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('iniciar_combate_tutorial').setLabel('Reintentar').setStyle(ButtonStyle.Primary))] });
}

async function mostrarMenuContinuarTutorial(interaction, userData) {
    const emojiSabio = '🧙‍♂️';
    const mensaje = generarMensajeEmbed({
        titulo: `${emojiSabio} **Tutorial en Progreso**`,
        descripcion: `Parece que dejaste tu aventura a medias, **${userData.nombre || 'Viajero'}**.\n\n` +
            `Estado actual: **${userData.estado || 'Desconocido'}**\n` +
            `¿Deseas continuar donde lo dejaste o empezar de nuevo?`,
        color: COLORES.AMARILLO_TUTORIAL,
        botones: [
            { id: 'tutorial_continuar', label: 'Continuar', style: ButtonStyle.Success, emoji: '▶️' },
            { id: 'reiniciar_tutorial_confirm', label: 'Borrar y Reiniciar', style: ButtonStyle.Danger, emoji: '🗑️' } // ID directo a lógica de borrado
        ]
    });
    
    if (interaction.replied || interaction.deferred) await interaction.editReply(mensaje);
    else await interaction.reply(mensaje);
}

// ---------------------------------------------------------------------------------------
// 🏰 SISTEMA SPACE CENTRAL (HUB)
// ---------------------------------------------------------------------------------------



async function manejarHotel(interaction) {
    const playerDB = getPlayerDB(interaction);
    const player = await playerDB.getPlayer(interaction.user.id);
    const COSTO_HOTEL = 50;

    if (!player) return;

    if (player.inventory.gold < COSTO_HOTEL) {
        const msg = { 
            content: `🚫 **Fondos Insuficientes**\nNecesitas ${COSTO_HOTEL} PassCoins para pagar la habitación.\n¡Ve al **Bosque Inicial** a conseguir más!`, 
            ephemeral: true 
        };
        return (interaction.replied || interaction.deferred) ? interaction.followUp(msg) : interaction.reply(msg);
    }

    // Cobrar y Curar
    player.inventory.gold -= COSTO_HOTEL;
    player.stats.hp = player.stats.maxHp;
    player.stats.mp = player.stats.maxMp;

    // Música de Economía/Descanso
    if (musicManager) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (member.voice.channel) musicManager.playFile(VARIABLES_MUSICA.ECONOMIA.file, VARIABLES_MUSICA.ECONOMIA.loop);
    }

    // Verificar Misión 1
    let misionCompletada = false;
    if (player.mission && player.mission.id === 'mision_tutorial_bosque') {
        player.mission.status = 'completed';
        player.mission.completedAt = new Date().toISOString();
        misionCompletada = true;
        
        // Asignar siguiente misión
        player.mission = {
            id: 'mision_viaje_reino',
            status: 'active',
            step: 'intro',
            description: 'Habla con ElSabio y viaja a tu Reino Racial.'
        };
    }

    await playerDB.savePlayer(player);

    const embedDescanso = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🏨 Descanso Reparador')
        .setDescription(`
Has pasado la noche en una cómoda cápsula del Hotel Espacial.
**-${COSTO_HOTEL} PassCoins**

✨ **¡Tu Vida y Energía han sido restauradas al 100%!**
    `);

    if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embedDescanso], ephemeral: true });
    } else {
        await interaction.reply({ embeds: [embedDescanso], ephemeral: true });
    }

    if (misionCompletada) {
        // Transición dramática a la siguiente misión
        setTimeout(async () => {
            await interaction.followUp({ 
                content: '🔔 **¡ElSabio te está llamando!** Parece que tiene algo importante que decirte...',
                ephemeral: true 
            });
            await mostrarSpaceCentral(interaction);
        }, 2000);
    }
}

async function mostrarArmeria(interaction) {
    const playerDB = getPlayerDB(interaction);
    const player = await playerDB.getPlayer(interaction.user.id);

    // Usar ITEMS_ARMERIA global
    const itemsVenta = ITEMS_ARMERIA;

    // Música de Economía
    if (musicManager) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (member.voice.channel) musicManager.playFile(VARIABLES_MUSICA.ECONOMIA.file, VARIABLES_MUSICA.ECONOMIA.loop);
    }

    const embedArmeria = new EmbedBuilder()
        .setColor('#FF4500')
        .setTitle('⚔️ Armería Galáctica')
        .setDescription(`
Bienvenido a la armería. Aquí encontrarás el equipo necesario para sobrevivir.

**Tu Saldo:** ${player.inventory.gold} ${getEmoji('passcoin') || 'PassCoins'}
`)
        .addFields(
            itemsVenta.map(item => ({
                name: `${item.emoji} ${item.name}`,
                value: `Precio: **${item.price} PC**\n*${item.desc}*`,
                inline: true
            }))
        );

    // Crear filas de botones (máximo 5 por fila)
    const rows = [];
    let currentRow = new ActionRowBuilder();
    
    itemsVenta.forEach((item, index) => {
        // Discord permite max 5 botones por fila.
        // Si tenemos muchos items, hay que paginar o dividir filas.
        // Aquí asumimos pocos items por ahora, pero dividimos si pasa de 4 para dejar hueco a "Volver".
        if (currentRow.components.length >= 4) { 
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
        }
        
        currentRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`comprar_${item.id}`)
                .setLabel(`${item.name.split(' ')[0]}...`) // Nombre corto
                .setStyle(ButtonStyle.Primary)
                .setEmoji(item.emoji)
                .setDisabled(player.inventory.gold < item.price)
        );
    });

    // Botón volver siempre al final
    currentRow.addComponents(
        new ButtonBuilder()
            .setCustomId('ir_space_central')
            .setLabel('Volver')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
    );
    rows.push(currentRow);

    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [embedArmeria], components: rows, files: [] });
    } else {
        await interaction.update({ embeds: [embedArmeria], components: rows, files: [] });
    }
}

async function manejarCompra(interaction, itemId) {
    const playerDB = getPlayerDB(interaction);
    const player = await playerDB.getPlayer(interaction.user.id);
    
    // Buscar en ITEMS_ARMERIA global
    const item = ITEMS_ARMERIA.find(i => i.id === itemId);

    if (!item) {
        const msg = { content: '❌ Ítem no válido.', ephemeral: true };
        return (interaction.replied || interaction.deferred) ? interaction.followUp(msg) : interaction.reply(msg);
    }

    if (player.inventory.gold < item.price) {
        const msg = { content: '🚫 No tienes suficientes PassCoins.', ephemeral: true };
        return (interaction.replied || interaction.deferred) ? interaction.followUp(msg) : interaction.reply(msg);
    }

    // Procesar compra
    player.inventory.gold -= item.price;
    
    // Añadir al inventario
    if (!player.inventory.items[itemId]) {
        player.inventory.items[itemId] = { 
            name: item.name,
            type: item.type,
            quantity: 0 
        };
    }
    player.inventory.items[itemId].quantity += 1;

    await playerDB.savePlayer(player);

    const msg = { 
        content: `✅ Has comprado **${item.name}** por ${item.price} PassCoins.`, 
        ephemeral: true 
    };
    if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
    } else {
        await interaction.reply(msg);
    }
    
    // Recargar armería para actualizar saldo y botones
    await mostrarArmeria(interaction);
}

async function mostrarPortalReinos(interaction) {
    const playerDB = getPlayerDB(interaction);
    const player = await playerDB.getPlayer(interaction.user.id);
    
    // Determinar el reino basado en la raza del jugador
    const razaKey = player.razaId || (player.raza ? player.raza.name.toUpperCase() : 'HUMANOS');
    const reinoKey = RAZA_TO_REINO[razaKey] || 'reino_mirai';
    const reinoData = REINOS_OFICIALES[reinoKey];

    const embedPortal = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle('🌀 Portal de los Reinos')
        .setDescription(`
        Has llegado a la sala de portales. Aquí la energía mágica fluye intensamente.
        
        **Tu Destino:** ${reinoData.emoji} **${reinoData.name}**
        *${reinoData.desc}*
        
        ¿Estás listo para viajar?
        `);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`entrar_reino_${reinoKey}`) // Pasamos la key del reino
            .setLabel(`Viajar a ${reinoData.name}`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('🌀'),
        new ButtonBuilder()
            .setCustomId('ir_space_central')
            .setLabel('Volver a Space Central')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
    );

    const files = [];

    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [embedPortal], components: [row], files: files });
    } else {
        await interaction.update({ embeds: [embedPortal], components: [row], files: files });
    }
}

async function mostrarReino(interaction, reinoKeyOverride = null) {
    const playerDB = getPlayerDB(interaction);
    const player = await playerDB.getPlayer(interaction.user.id);
    
    // Obtener reino (por defecto el de la raza, o el especificado en override)
    let reinoKey = reinoKeyOverride;
    if (!reinoKey) {
        const razaKey = player.razaId || (player.raza ? player.raza.name.toUpperCase() : 'HUMANOS');
        reinoKey = RAZA_TO_REINO[razaKey] || 'reino_mirai';
    }
    
    const reinoData = REINOS_OFICIALES[reinoKey];

    // Lógica de Misión 2
    let misionCompletada = false;
    if (player.mission && player.mission.id === 'mision_viaje_reino') {
        player.mission.status = 'completed';
        player.mission.completedAt = new Date().toISOString();
        misionCompletada = true;
        
        // Misión 3 (Futura) o Fin de Demo
        player.mission = {
            id: 'mision_exploracion_libre',
            status: 'active',
            desc: 'Explora el mundo, mejora tu equipo y sube de nivel.'
        };
        await playerDB.savePlayer(player);
    }

    const embedReino = new EmbedBuilder()
        .setColor(COLORES.AMARILLO_TUTORIAL)
        .setTitle(`${reinoData.emoji} ${reinoData.name}`)
        .setDescription(`
        ¡Bienvenido a casa, **${player.name}**!
        
        Has llegado a **${reinoData.name}**.
        *${reinoData.desc}*
        
        Aquí puedes explorar libremente, enfrentarte a enemigos de tu raza y descubrir secretos.
        `);
        
    if (misionCompletada) {
        embedReino.addFields({ 
            name: '✅ ¡Misión Completada!', 
            value: 'Has llegado a tu Reino Racial. El Sabio estará orgulloso.\nAhora puedes **Explorar** este reino o volver a Space Central.' 
        });
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`hub_explorar_reino`) // ID Estandarizado
            .setLabel('Explorar Reino')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🗺️'),
        new ButtonBuilder()
            .setCustomId('ir_space_central')
            .setLabel('Volver a Space Central')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
    );

    if (misionCompletada) {
        setTimeout(async () => {
             await interaction.followUp({ content: '🎉 **¡Has completado el Tutorial y la Introducción!**\nAhora eres libre de forjar tu propio destino en PassQuirk.', ephemeral: true });
        }, 1000);
    }

    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [embedReino], components: [row], files: [] });
    } else {
        await interaction.update({ embeds: [embedReino], components: [row], files: [] });
    }
}

// ---------------------------------------------------------------------------------------
// 🏰 FIN SISTEMA SPACE CENTRAL
// ---------------------------------------------------------------------------------------

// --- EXPORTACIÓN ---
module.exports = {
    data: new SlashCommandBuilder().setName('passquirkrpg').setDescription('Inicia tu aventura en PassQuirk RPG'),
    async handleInteraction(interaction) {
        await this.procesarInteraccion(interaction);
    },
    async execute(interaction) {
        try {
            const player = await getPlayerDB(interaction).getPlayer(interaction.user.id);
            if (player) {
                // Si el jugador ya existe, mostrar menú para Continuar o Reiniciar
                await mostrarMenuReinicio(interaction);
            } else {
                // Verificar progreso tutorial guardado
                let userData = datosPersonaje.get(interaction.user.id);
                if (!userData) {
                    const loadedData = loadTutorialState();
                    userData = loadedData.get(interaction.user.id);
                    if (userData) datosPersonaje.set(interaction.user.id, userData);
                }

                if (userData && userData.estado && userData.estado !== ESTADOS.NO_INICIADO) {
                    await mostrarMenuContinuarTutorial(interaction, userData);
                } else {
                    await iniciarTutorialElSabio(interaction);
                }
            }
        } catch (error) {
            console.error('Error en passquirkrpg:', error);
            await interaction.reply({ content: '❌ Error crítico iniciando el juego.', ephemeral: true });
        }
    },
    
    // Manejador de interacciones (Botones, Modales, Selects)
    async procesarInteraccion(interaction) {
        const id = interaction.customId;
        console.log(`[DEBUG] passquirkrpg.procesarInteraccion received: ${id} from user ${interaction.user.id}`);
        
        // --- DEFER INITIALIZATION ---
        // Deferir inmediatamente si no es un modal (los modales no se pueden deferir antes de mostrarse)
        // y si no es un botón que abre un modal (tutorial_step_nombre, tutorial_aspecto_url)
        const idsQueAbrenModal = ['tutorial_step_nombre', 'tutorial_aspecto_url'];
        if (!idsQueAbrenModal.includes(id) && !interaction.isModalSubmit() && !interaction.replied && !interaction.deferred) {
            try {
                await interaction.deferUpdate();
            } catch (e) {
                // Ignorar si ya fue deferido o respondido en milisegundos
                console.log('[DEBUG] Defer error (safe to ignore):', e.message);
            }
        }

        if (id === 'tutorial_continuar') {
             let userData = datosPersonaje.get(interaction.user.id);
             
             // Intentar recargar si no está en memoria
             if (!userData) {
                 const loadedData = loadTutorialState();
                 userData = loadedData.get(interaction.user.id);
                 if (userData) {
                     datosPersonaje.set(interaction.user.id, userData);
                 }
             }

             if (userData) {
                 // Redirigir según estado
                 switch(userData.estado) {
                     case ESTADOS.ELIGIENDO_GENERO: await mostrarSeleccionGenero(interaction, userData.nombre); break;
                     case ESTADOS.ELIGIENDO_RAZA: await mostrarSeleccionRaza(interaction); break;
                     case ESTADOS.ELIGIENDO_ASPECTO: await mostrarMensajeAspecto(interaction); break;
                     case ESTADOS.ELIGIENDO_CLASE: await mostrarSeleccionClase(interaction); break;
                     case ESTADOS.ELIGIENDO_REINO: await mostrarSeleccionReino(interaction); break;
                     case ESTADOS.COMBATE_TUTORIAL: await iniciarCombateTutorial(interaction); break; // Reiniciar combate si se quedó a medias
                     default: await iniciarTutorialElSabio(interaction);
                 }
             } else {
                 await iniciarTutorialElSabio(interaction);
             }
        }
        else if (id === 'tutorial_reiniciar' || id === 'reiniciar_tutorial_confirm') {
            // Borrar de Supabase y memoria
            try {
                // Eliminar de Supabase
                await getPlayerDB(interaction).deletePlayer(interaction.user.id);
                console.log(`[RESET] Jugador ${interaction.user.id} eliminado de Supabase.`);
            } catch (e) { console.log('Error borrando player DB:', e); }
            
            // Eliminar de memoria local
            datosPersonaje.delete(interaction.user.id);
            // Guardar estado vacío en tutorial.json
            guardarEstado();
            console.log(`[RESET] Jugador ${interaction.user.id} eliminado de memoria local.`);
            
            if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
            
            // Reiniciar flujo tutorial
            await iniciarTutorialElSabio(interaction);
        }
        else if (id === 'tutorial_musica_si' || id === 'tutorial_musica_no') await procesarMusica(interaction);
        else if (id === 'tutorial_step_nombre') await mostrarModalNombre(interaction);
        else if (id === 'tutorial_step_aspecto') await mostrarModalAspecto(interaction);
        else if (id === 'tutorial_aspecto_subir') await solicitarImagenPorMensaje(interaction);
        else if (id === 'tutorial_aspecto_url') await mostrarModalAspectoUrl(interaction);
        else if (id === 'genero_masculino' || id === 'genero_femenino') await procesarGenero(interaction);
        else if (id.startsWith('raza_')) await procesarRaza(interaction); // Handler de raza
        else if (id.startsWith('confirmar_raza_')) await confirmarRaza(interaction);
        else if (id === 'volver_raza') await mostrarSeleccionRaza(interaction);
        else if (id === 'tutorial_confirmar_ficha') await mostrarSeleccionClase(interaction);
        else if (id.startsWith('clase_')) await procesarClase(interaction);
        else if (id.startsWith('confirmar_clase_')) await confirmarClase(interaction);
        else if (id === 'volver_seleccion_clase') await mostrarSeleccionClase(interaction);
        else if (id === 'continuar_a_reino') {
            let userData = getUserDataSafe(interaction.user.id);
            if (!userData) {
                // Si falla recuperación, reiniciamos a un estado seguro o mostramos error
                await interaction.reply({ content: '❌ Sesión expirada. Por favor reinicia con /passquirkrpg.', ephemeral: true });
                return;
            }
            userData.estado = ESTADOS.ELIGIENDO_REINO;
            datosPersonaje.set(interaction.user.id, userData);
            guardarEstado();
            await mostrarSeleccionReino(interaction);
        }
        else if (id === 'tutorial_reino_select') await seleccionarReino(interaction);
        else if (id === 'iniciar_combate_tutorial' || id === 'reiniciar_combate') await iniciarCombateTutorial(interaction);
        else if (id.startsWith('combate_')) {
            if (id === 'combate_ataque_final') await ataqueFinalizador(interaction);
            else await procesarTurnoCombate(interaction);
        }
        else if (id === 'ir_space_central' || id === 'ir_intro_space_central') {
            const userData = datosPersonaje.get(interaction.user.id);
            if (userData) await completarTutorial(interaction);
            else {
                // Caso: Continuar partida existente
                const player = await getPlayerDB(interaction).getPlayer(interaction.user.id);
                await mostrarSpaceCentral(interaction, player ? player.username : interaction.user.username);
            }
        }
        // --- NUEVO FLUJO POST-TUTORIAL ---
        else if (id === 'aceptar_mision_bosque') await aceptarMisionBosque(interaction);
        else if (id === 'ir_bosque_inicial') await mostrarBosqueInicial(interaction);
        else if (id === 'explorar_bosque') {
            const cmd = interaction.client.commands.get('explorar');
            if (cmd) await cmd.execute(interaction, interaction.client);
            else await interaction.reply({ content: '❌ Error: Sistema de exploración no disponible.', ephemeral: true });
        }
        else if (id === 'volver_space_central') {
            const player = await getPlayerDB(interaction).getPlayer(interaction.user.id);
            
            // Verificar Misión 1 (Bosque -> Hotel)
            if (player && player.mission && player.mission.id === 'mision_tutorial_bosque' && player.mission.status === 'active') {
                // Verificar si tiene 50 PassCoins
                if (player.inventory && player.inventory.gold >= 50) {
                     player.mission.status = 'completed';
                     player.mission.completedAt = new Date().toISOString();
                     // Asignar siguiente misión
                     player.mission = {
                        id: 'mision_viaje_reino',
                        status: 'active',
                        desc: 'Viaja a tu Reino Racial usando el Portal de los Reinos.'
                     };
                     await getPlayerDB(interaction).savePlayer(player);
                     await mostrarSpaceCentral(interaction); // Mostrará el nuevo diálogo de misión
                } else {
                     await interaction.reply({ 
                         content: '⚠️ **¡Espera!** El Sabio te pidió **50 PassCoins** para pagar el hotel.\n🌲 Vuelve al bosque y derrota enemigos o encuentra tesoros hasta conseguir las monedas.', 
                         ephemeral: true 
                     });
                }
            } else {
                // Si no tiene misión activa o ya la completó, volver normal
                await mostrarSpaceCentral(interaction);
            }
        }
        else if (id === 'ir_portal_reinos') {
            const player = await getPlayerDB(interaction).getPlayer(interaction.user.id);
            // Verificar si ha completado la misión 1 antes de dejarle ir al portal
            // Opcional: Permitir ir pero con advertencia, pero el usuario pidió "Mision completa"
            
            // Si está en la misión del bosque, no dejarle ir al portal
            if (player.mission && player.mission.id === 'mision_tutorial_bosque' && player.mission.status === 'active') {
                 await interaction.reply({ 
                     content: '🚫 **Acceso Restringido**\nEl Sabio te ha ordenado conseguir alojamiento primero.\nVe al **Hotel** (cuando tengas 50 PC) o al **Bosque** para conseguirlos.', 
                     ephemeral: true 
                 });
                 return;
            }
            
            await mostrarPortalReinos(interaction);
        }
        else if (id.startsWith('entrar_reino_')) {
            const reinoKey = id.replace('entrar_reino_', '');
            await mostrarReino(interaction, reinoKey);
        }
        else if (id === 'hub_explorar_reino') {
            const playerDB = getPlayerDB(interaction);
            const player = await playerDB.getPlayer(interaction.user.id);
            // Determinar reino del jugador
            const razaKey = player.razaId || (player.raza ? player.raza.name.toUpperCase() : 'HUMANOS');
            const reinoKey = RAZA_TO_REINO[razaKey] || 'reino_mirai';
            const reinoData = REINOS_OFICIALES[reinoKey];

            // Intentar iniciar exploración directamente
            if (interaction.client.gameManager && interaction.client.gameManager.systems.exploration) {
                 try {
                     await interaction.client.gameManager.systems.exploration.startExploration(interaction, player, reinoData.name);
                 } catch (error) {
                     if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
                     } else {
                        await interaction.followUp({ content: `❌ Error: ${error.message}`, ephemeral: true });
                     }
                 }
            } else {
                // Fallback
                const cmd = interaction.client.commands.get('explorar');
                if (cmd) await cmd.execute(interaction, interaction.client);
                else {
                    const msg = { content: '❌ Error: Sistema de exploración no disponible.', ephemeral: true };
                    if (interaction.deferred || interaction.replied) await interaction.followUp(msg);
                    else await interaction.reply(msg);
                }
            }
        }
        
        // --- Space Central Features ---
        else if (id === 'hotel_space_central') await manejarHotel(interaction);
        else if (id === 'armeria_space_central') await mostrarArmeria(interaction);
        else if (id.startsWith('comprar_')) {
            const itemId = id.replace('comprar_', '');
            await manejarCompra(interaction, itemId);
        }
        
        // --- SPACE CENTRAL BUTTONS (Delegación) ---
        else if (id.startsWith('hub_')) {
            if (id === 'hub_explorar') {
                const cmd = interaction.client.commands.get('explorar');
                if (cmd) {
                    if (!interaction.replied && !interaction.deferred) {
                        try {
                            // Deferir para evitar timeout si explorar tarda
                            await interaction.deferUpdate();
                        } catch (e) {}
                    }
                    await cmd.execute(interaction, interaction.client);
                }
                else {
                    const msg = { content: '❌ El comando Explorar no está disponible.', ephemeral: true };
                    if (interaction.deferred || interaction.replied) await interaction.followUp(msg);
                    else await interaction.reply(msg);
                }
            } 
            else if (id === 'hub_hotel') await manejarHotel(interaction);
            else if (id === 'hub_armeria') await mostrarArmeria(interaction);
            else if (id === 'hub_portal') await mostrarPortalReinos(interaction);
            else if (id === 'hub_perfil') {
                const cmd = interaction.client.commands.get('perfil');
                if (cmd) {
                    if (!interaction.replied && !interaction.deferred) {
                        try { await interaction.deferUpdate(); } catch (e) {}
                    }
                    await cmd.execute(interaction, interaction.client);
                }
                else {
                    const msg = { content: '❌ El comando Perfil no está disponible.', ephemeral: true };
                    if (interaction.deferred || interaction.replied) await interaction.followUp(msg);
                    else await interaction.reply(msg);
                }
            }
            else if (id === 'hub_ayuda') {
                const cmd = interaction.client.commands.get('ayuda');
                if (cmd) {
                    if (!interaction.replied && !interaction.deferred) {
                        try { await interaction.deferUpdate(); } catch (e) {}
                    }
                    await cmd.execute(interaction, interaction.client);
                }
                else {
                    const msg = { content: '❌ El comando Ayuda no está disponible.', ephemeral: true };
                    if (interaction.deferred || interaction.replied) await interaction.followUp(msg);
                    else await interaction.reply(msg);
                }
            }
            else {
                 const msg = { content: '🚧 Función en mantenimiento.', ephemeral: true };
                 if (interaction.deferred || interaction.replied) await interaction.followUp(msg);
                 else await interaction.reply(msg);
            }
        }
        else if (id === 'explorar_mundo') {
            const cmd = interaction.client.commands.get('explorar');
            if (cmd) await cmd.execute(interaction, interaction.client);
            else {
                const msg = { content: '❌ El sistema de exploración no está cargado.', ephemeral: true };
                if (interaction.deferred || interaction.replied) await interaction.followUp(msg);
                else await interaction.reply(msg);
            }
        }
        else if (id === 'ver_personaje') {
            const cmd = interaction.client.commands.get('perfil');
            if (cmd) await cmd.execute(interaction, interaction.client);
            else {
                const msg = { content: '❌ El comando de perfil no está disponible.', ephemeral: true };
                if (interaction.deferred || interaction.replied) await interaction.followUp(msg);
                else await interaction.reply(msg);
            }
        }
        else if (id === 'ayuda_comandos') {
            const cmd = interaction.client.commands.get('ayuda');
            if (cmd) await cmd.execute(interaction, interaction.client);
            else {
                const msg = { content: 'El sistema de ayuda está en mantenimiento.', ephemeral: true };
                if (interaction.deferred || interaction.replied) await interaction.followUp(msg);
                else await interaction.reply(msg);
            }
        }

        // Modales
        if (interaction.isModalSubmit()) {
            if (id === 'modal_tutorial_nombre') await procesarNombre(interaction);
            else if (id === 'modal_tutorial_aspecto') await procesarAspecto(interaction);
        } else if (!interaction.replied && !interaction.deferred) {
             // Log para debug de botones no manejados
             console.log(`⚠️ Interacción de botón no manejada: ${id}`);
        }
    }
};
