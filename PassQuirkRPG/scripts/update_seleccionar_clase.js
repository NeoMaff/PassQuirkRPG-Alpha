const fs = require('fs');
const path = require('path');

const filePath = 'e:\\PassQuirk\\PassQuirkRPG\\src\\commands\\slash\\passquirkrpg.js';

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Match the end of the generarMensajeEmbed call inside seleccionarClase
    // We look for the buttons array ending, then });
    const regex = /(botones:\s*\[[\s\S]*?\]\s*\}\);)/;

    // We need to be careful not to match other calls. 
    // The one in seleccionarClase has "id: 'elegir_reino_inicial'" inside buttons.

    const specificRegex = /(id:\s*'elegir_reino_inicial'[\s\S]*?\]\s*\}\);)/;

    const injection = `
    // Añadir campos detallados de la clase
    if (mensaje.embed) {
        mensaje.embed.addFields(
            { 
                name: '🎭 Rol & Estilo', 
                value: \`**Rol:** \${claseData.role}\\n**Estilo:** \${claseData.style}\`, 
                inline: false 
            },
            { 
                name: '📊 Estadísticas Base', 
                value: \`❤️ HP: \${claseData.baseStats.hp} | ⚡ MP: \${claseData.baseStats.mp}\\n⚔️ ATK: \${claseData.baseStats.attack} | 🛡️ DEF: \${claseData.baseStats.defense} | 💨 SPD: \${claseData.baseStats.speed}\`, 
                inline: false 
            },
            { 
                name: '⚔️ Habilidades', 
                value: \`**Básica:** \${claseData.abilities.basic.name} (\${claseData.abilities.basic.damage})\\n\` +
                       \`**Poder:** \${claseData.abilities.power.name} (\${claseData.abilities.power.damage})\\n\` +
                       \`**Especial:** \${claseData.abilities.special.name} (\${claseData.abilities.special.damage})\`, 
                inline: false 
            }
        );

        if (claseData.image) {
            mensaje.embed.setThumbnail(claseData.image);
        }
    }`;

    if (specificRegex.test(content)) {
        content = content.replace(specificRegex, `$1${injection}`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Successfully updated seleccionarClase");
    } else {
        console.error("Could not find target block in seleccionarClase");
        process.exit(1);
    }

} catch (err) {
    console.error("Error updating file:", err);
    process.exit(1);
}
