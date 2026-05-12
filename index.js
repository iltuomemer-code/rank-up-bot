const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    SlashCommandBuilder,
    PermissionFlagsBits,
    Routes
} = require('discord.js');

const { REST } = require('@discordjs/rest');
const express = require('express');

const TOKEN = process.env.TOKEN;
const WEB_PASSWORD = process.env.WEB_PASSWORD;

const CLIENT_ID = '1503434581565771827';
const GUILD_ID = '1500449963019337802';
const LEVEL_CHANNEL = '1500449963778510861';

const app = express();
app.use(express.json());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

app.get('/', (req, res) => {
    res.send('OpBot API is running!');
});

app.post('/announce', async (req, res) => {
    try {
        const { password, message } = req.body;

        if (password !== WEB_PASSWORD) {
            return res.status(403).send('Wrong password');
        }

        if (!message) {
            return res.status(400).send('No message provided');
        }

        const channel = await client.channels.fetch(LEVEL_CHANNEL);
        await channel.send(message);

        res.send('Message sent!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error sending message');
    }
});

client.login(TOKEN);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Website API running on port ${PORT}`);
});