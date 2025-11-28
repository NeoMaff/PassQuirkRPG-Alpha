const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Bot is in ${client.guilds.cache.size} guilds:`);
    client.guilds.cache.forEach(guild => {
        console.log(`- ${guild.name} (ID: ${guild.id})`);
    });

    const targetGuildId = process.env.GUILD_ID;
    if (client.guilds.cache.has(targetGuildId)) {
        console.log(`✅ Bot IS in the target development guild (${targetGuildId})`);
    } else {
        console.log(`❌ Bot is NOT in the target development guild (${targetGuildId})`);
    }

    console.log('\n--- Invite Link Generator ---');
    const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
    console.log(`Invite Link (Admin + Slash Commands): ${inviteLink}`);

    process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
