import os

file_path = r'e:\PassQuirk\PassQuirkRPG\src\commands\slash\passquirkrpg.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update CLASES_OFICIALES
old_classes = """// Clases oficiales
const CLASES_OFICIALES = officialData.CLASES || passquirkData.clases || {
    celestial: { name: 'Celestial', emoji: '🪽', desc: 'Ser de luz con habilidades curativas y ataques sagrados de área.' },
    fenix: { name: 'Fénix', emoji: '🔥', desc: 'Renace tras ser derrotado; domina el fuego y el resurgir explosivo.' },
    berserker: { name: 'Berserker', emoji: '⚔️', desc: 'Guerrero desatado con fuerza bruta creciente cuanto más daño recibe.' },
    inmortal: { name: 'Inmortal', emoji: '☠️', desc: 'No puede morir fácilmente; regenera y resiste efectos mortales.' },
    demon: { name: 'Demon', emoji: '👹', desc: 'Poder oscuro, drenaje de vida y habilidades infernales.' },
    sombra: { name: 'Sombra', emoji: '⚔️🌀', desc: 'Ninja silencioso y letal; experto en clones, humo y ataques críticos.' }
};"""

new_classes = """// Clases oficiales - Usar datos de passquirk-official-data.js
const CLASES_OFICIALES = officialData.BASE_CLASSES;

// Razas oficiales
const RACES = officialData.RACES;"""

if old_classes in content:
    content = content.replace(old_classes, new_classes)
    print("Updated CLASES_OFICIALES")
else:
    print("Could not find CLASES_OFICIALES block")

# 2. Update mostrarSeleccionClase description
old_desc = """            `🪽 **Celestial** - ${CLASES_OFICIALES.celestial.desc}\\n` +
            `🔥 **Fénix** - ${CLASES_OFICIALES.fenix.desc}\\n` +
            `⚔️ **Berserker** - ${CLASES_OFICIALES.berserker.desc}\\n` +
            `☠️ **Inmortal** - ${CLASES_OFICIALES.inmortal.desc}\\n` +
            `👹 **Demon** - ${CLASES_OFICIALES.demon.desc}\\n` +
            `⚔️🌀 **Sombra** - ${CLASES_OFICIALES.sombra.desc}\\n\\n` +
            `*"Elige sabiamente, esta decisión definirá tu camino..."*`,"""

new_desc = """            `🪽 **Celestial** - ${CLASES_OFICIALES.CELESTIAL.description}\\n` +
            `🔥 **Fénix** - ${CLASES_OFICIALES.FÉNIX.description}\\n` +
            `🌌 **Void** - ${CLASES_OFICIALES.VOID.description}\\n` +
            `🥷 **Shinobi** - ${CLASES_OFICIALES.SHINOBI.description}\\n` +
            `✨ **Alma Naciente** - ${CLASES_OFICIALES["ALMA NACIENTE"].description}\\n` +
            `💀 **Nigromante** - ${CLASES_OFICIALES.NIGROMANTE.description}\\n\\n` +
            `*"Elige sabiamente, esta decisión definirá tu camino..."*`,"""

if old_desc in content:
    content = content.replace(old_desc, new_desc)
    print("Updated mostrarSeleccionClase description")
else:
    print("Could not find mostrarSeleccionClase description block")
    # Try fuzzy match or manual check if needed

# 3. Update buttons
old_buttons = """    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('clase_celestial').setLabel('Celestial').setEmoji('🪽').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('clase_fenix').setLabel('Fénix').setEmoji('🔥').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('clase_berserker').setLabel('Berserker').setEmoji('⚔️').setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('clase_inmortal').setLabel('Inmortal').setEmoji('☠️').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('clase_demon').setLabel('Demon').setEmoji('👹').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('clase_sombra').setLabel('Sombra').setEmoji('🌀').setStyle(ButtonStyle.Secondary)
    );"""

new_buttons = """    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('clase_CELESTIAL').setLabel('Celestial').setEmoji('🪽').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('clase_FÉNIX').setLabel('Fénix').setEmoji('🔥').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('clase_VOID').setLabel('Void').setEmoji('🌌').setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('clase_SHINOBI').setLabel('Shinobi').setEmoji('🥷').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('clase_ALMA NACIENTE').setLabel('Alma Naciente').setEmoji('✨').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('clase_NIGROMANTE').setLabel('Nigromante').setEmoji('💀').setStyle(ButtonStyle.Danger)
    );"""

if old_buttons in content:
    content = content.replace(old_buttons, new_buttons)
    print("Updated buttons")
else:
    print("Could not find buttons block")

# 4. Update switch cases
old_switch = """                    case 'clase_celestial':
                    case 'clase_fenix':
                    case 'clase_berserker':
                    case 'clase_inmortal':
                    case 'clase_demon':
                    case 'clase_sombra':
                        await seleccionarClase(interaction);
                        break;"""

new_switch = """                    case 'clase_CELESTIAL':
                    case 'clase_FÉNIX':
                    case 'clase_VOID':
                    case 'clase_SHINOBI':
                    case 'clase_ALMA NACIENTE':
                    case 'clase_NIGROMANTE':
                        await seleccionarClase(interaction);
                        break;"""

if old_switch in content:
    content = content.replace(old_switch, new_switch)
    print("Updated switch cases")
else:
    print("Could not find switch cases block")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
