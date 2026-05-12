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

const RANK_ROLES = [
    '1500449963405082637',
    '1500449963405082636',
    '1500452697827053762',
    '1500449963405082635',
    '1500501265539534959',
    '1500449963019337809',
    '1500501738170355914',
    '1500449963019337808',
    '1500449963019337807',
    '1500449963019337806',
    '1500449963019337805',
    '1500449963019337804'
];

const app = express();

app.use(express.json());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const commands = [

    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show bot commands'),

    new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Check your rank')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check')
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName('send')
        .setDescription('Send a message as OpBot')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to send')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageMessages
        ),

    new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Moderation commands')

        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User')
                        .setRequired(true)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User')
                        .setRequired(true)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Delete messages')
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('1-100')
                        .setRequired(true)
                )
        )

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function loadCommands() {

    try {

        await rest.put(
            Routes.applicationGuildCommands(
                CLIENT_ID,
                GUILD_ID
            ),
            { body: commands }
        );

        console.log('Slash commands loaded!');

    } catch (error) {

        console.error(error);

    }
}

client.once('clientReady', async () => {

    console.log(`Logged in as ${client.user.tag}`);

    await loadCommands();

});

client.on('guildMemberUpdate', async (oldMember, newMember) => {

    const addedRole = newMember.roles.cache.find(role =>
        !oldMember.roles.cache.has(role.id) &&
        RANK_ROLES.includes(role.id)
    );

    if (!addedRole) return;

    const channel =
        newMember.guild.channels.cache.get(LEVEL_CHANNEL);

    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor('Gold')
        .setTitle('🎉 RANK UP!')
        .setDescription(
            `Congratulations ${newMember}!\n\n` +
            `You ranked up to **${addedRole.name}**! 🚀`
        )
        .setThumbnail(
            newMember.user.displayAvatarURL()
        )
        .setFooter({
            text: 'Keep grinding!'
        })
        .setTimestamp();

    channel.send({
        embeds: [embed]
    });

});

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'help') {

        const embed = new EmbedBuilder()
            .setColor('Purple')
            .setTitle('🤖 OpBot Commands')
            .setDescription(
                '**/rank** - Check rank\n' +
                '**/send** - Send message\n' +
                '**/mod kick** - Kick user\n' +
                '**/mod ban** - Ban user\n' +
                '**/mod clear** - Clear messages'
            );

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    if (interaction.commandName === 'rank') {

        const user =
            interaction.options.getUser('user') ||
            interaction.user;

        const member =
            await interaction.guild.members.fetch(user.id);

        const rankRole = member.roles.cache
            .filter(role =>
                RANK_ROLES.includes(role.id)
            )
            .sort((a, b) =>
                b.position - a.position
            )
            .first();

        const embed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle('🏆 Rank')

            .setDescription(
                rankRole
                    ? `${user} is ranked **${rankRole.name}**`
                    : `${user} has no rank yet`
            )

            .setThumbnail(
                user.displayAvatarURL()
            );

        return interaction.reply({
            embeds: [embed]
        });
    }

    if (interaction.commandName === 'send') {

        const message =
            interaction.options.getString('message');

        await interaction.channel.send(message);

        return interaction.reply({
            content: '✅ Message sent!',
            ephemeral: true
        });
    }

    if (interaction.commandName === 'mod') {

        const subcommand =
            interaction.options.getSubcommand();

        if (subcommand === 'kick') {

            const user =
                interaction.options.getUser('user');

            const member =
                await interaction.guild.members.fetch(user.id);

            await member.kick();

            return interaction.reply(
                `✅ Kicked ${user.tag}`
            );
        }

        if (subcommand === 'ban') {

            const user =
                interaction.options.getUser('user');

            const member =
                await interaction.guild.members.fetch(user.id);

            await member.ban();

            return interaction.reply(
                `✅ Banned ${user.tag}`
            );
        }

        if (subcommand === 'clear') {

            const amount =
                interaction.options.getInteger('amount');

            await interaction.channel.bulkDelete(
                amount,
                true
            );

            return interaction.reply({
                content:
                    `✅ Deleted ${amount} messages`,
                ephemeral: true
            });
        }
    }
});

app.get('/', (req, res) => {

    res.send('OpBot API is running!');

});

app.post('/announce', async (req, res) => {

    try {

        const {
            password,
            message,
            channelId
        } = req.body;

        if (password !== WEB_PASSWORD) {

            return res
                .status(403)
                .send('Wrong password');
        }

        if (!message) {

            return res
                .status(400)
                .send('No message provided');
        }

        if (!channelId) {

            return res
                .status(400)
                .send('No channel selected');
        }

        const channel =
            await client.channels.fetch(channelId);

        if (!channel || !channel.isTextBased()) {

            return res
                .status(400)
                .send('Invalid channel');
        }

        await channel.send(message);

        res.send('✅ Message sent!');

    }

    catch (error) {

        console.error(error);

        res
            .status(500)
            .send('❌ Error sending message');
    }
});

client.login(TOKEN);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Website API running on port ${PORT}`
    );

});