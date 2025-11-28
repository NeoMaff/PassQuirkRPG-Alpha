const fs = require('fs');
const path = require('path');

const filePath = 'e:\\PassQuirk\\PassQuirkRPG\\src\\commands\\slash\\passquirkrpg.js';

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Update CLASES_OFICIALES
    // Match from "const CLASES_OFICIALES =" to the closing "};"
    const regexClasses = /const CLASES_OFICIALES = [\s\S]*?};/;
    const newClasses = `// Clases oficiales - Usar datos de passquirk-official-data.js
const CLASES_OFICIALES = officialData.BASE_CLASSES;

// Razas oficiales
const RACES = officialData.RACES;`;

    if (regexClasses.test(content)) {
        content = content.replace(regexClasses, newClasses);
        console.log("Updated CLASES_OFICIALES");
    } else {
        console.log("Could not find CLASES_OFICIALES block with regex");
    }

    // 2. Update mostrarSeleccionClase description
    // Match the block of text starting with Celestial and ending with the quote
    // We look for `🪽 **Celestial**` and end with `*"Elige sabiamente, esta decisión definirá tu camino..."*`
    const regexDesc = /`🪽 \*\*Celestial\*\*[\s\S]*?`\*"Elige sabiamente, esta decisión definirá tu camino\.\.\."\*`,/;

    const newDesc = `            \`🪽 **Celestial** - \${CLASES_OFICIALES.CELESTIAL.description}\\n\` +
            \`🔥 **Fénix** - \${CLASES_OFICIALES.FÉNIX.description}\\n\` +
            \`🌌 **Void** - \${CLASES_OFICIALES.VOID.description}\\n\` +
            \`🥷 **Shinobi** - \${CLASES_OFICIALES.SHINOBI.description}\\n\` +
            \`✨ **Alma Naciente** - \${CLASES_OFICIALES["ALMA NACIENTE"].description}\\n\` +
            \`💀 **Nigromante** - \${CLASES_OFICIALES.NIGROMANTE.description}\\n\\n\` +
            \`*"Elige sabiamente, esta decisión definirá tu camino..."*\`,`;

    if (regexDesc.test(content)) {
        content = content.replace(regexDesc, newDesc);
        console.log("Updated mostrarSeleccionClase description");
    } else {
        console.log("Could not find mostrarSeleccionClase description block with regex");
    }

    // 3. Update buttons
    // Match from "const row1 = new ActionRowBuilder()" to the end of row2 definition
    // We can match the specific button definitions
    const regexButtons = /const row1 = new ActionRowBuilder\(\)\.addComponents\([\s\S]*?const row2 = new ActionRowBuilder\(\)\.addComponents\([\s\S]*?\);/;

    const newButtons = `const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('clase_CELESTIAL').setLabel('Celestial').setEmoji('🪽').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('clase_FÉNIX').setLabel('Fénix').setEmoji('🔥').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('clase_VOID').setLabel('Void').setEmoji('🌌').setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('clase_SHINOBI').setLabel('Shinobi').setEmoji('🥷').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('clase_ALMA NACIENTE').setLabel('Alma Naciente').setEmoji('✨').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('clase_NIGROMANTE').setLabel('Nigromante').setEmoji('💀').setStyle(ButtonStyle.Danger)
    );`;

    if (regexButtons.test(content)) {
        content = content.replace(regexButtons, newButtons);
        console.log("Updated buttons");
    } else {
        console.log("Could not find buttons block with regex");
    }

    // 4. Update switch cases
    // Match the case block
    const regexSwitch = /case 'clase_celestial':[\s\S]*?break;/;

    const newSwitch = `                    case 'clase_CELESTIAL':
                    case 'clase_FÉNIX':
                    case 'clase_VOID':
                    case 'clase_SHINOBI':
                    case 'clase_ALMA NACIENTE':
                    case 'clase_NIGROMANTE':
                        await seleccionarClase(interaction);
                        break;`;

    if (regexSwitch.test(content)) {
        content = content.replace(regexSwitch, newSwitch);
        console.log("Updated switch cases");
    } else {
        console.log("Could not find switch cases block with regex");
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log("File updated successfully");

} catch (err) {
    console.error("Error updating file:", err);
}
