const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config({ path: 'e:/PassQuirk/PassQuirkRPG/.env' });

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    try {
        const guilds = await client.guilds.fetch();
        for (const guildRef of guilds.values()) {
            const guild = await guildRef.fetch();
            console.log(`\n--- Emojis in Guild: ${guild.name} ---`);

            const emojis = await guild.emojis.fetch();
            if (emojis.size === 0) {
                console.log("No emojis found.");
            } else {
                emojis.forEach(emoji => {
                    console.log(`Name: ${emoji.name}, ID: ${emoji.id}, Full: <:${emoji.name}:${emoji.id}>`);
                });
            }
        }
    } catch (err) {
        console.error("Error fetching guilds or emojis:", err);
    }

    client.destroy();
});

client.login(process.env.DISCORD_TOKEN);
