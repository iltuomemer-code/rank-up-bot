const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    SlashCommandBuilder,
    PermissionFlagsBits,
    Routes
} = require('discord.js');

const { REST } = require('@discordjs/rest');
const fs = require('fs');

const TOKEN = process.env.TOKEN;

const CLIENT_ID = '1503434581565771827';
const GUILD_ID = '1500449963019337802';
const LEVEL_CHANNEL = '1500449963778510861';

const XP_FILE = './xp.json';

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
    '1500449963019337804',
    '1504210891854581810'
];

let xpData = {};

if (fs.existsSync(XP_FILE)) {
    xpData = JSON.parse(fs.readFileSync(XP_FILE));
}

function saveXP() {
    fs.writeFileSync(XP_FILE, JSON.stringify(xpData, null, 2));
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const commands = [
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show commands'),

    new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Check rank and XP')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check')
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName('send')
        .setDescription('Send a message as the bot')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Use \\n for new lines')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName('roleset')
        .setDescription('Give someone a rank role')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Rank role')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Moderation commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(sub =>
            sub.setName('kick')
                .setDescription('Kick a user')
                .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
                .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('ban')
                .setDescription('Ban a user')
                .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
                .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('timeout')
                .setDescription('Timeout a user')
                .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
                .addIntegerOption(o => o.setName('minutes').setDescription('Minutes').setRequired(true))
                .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('untimeout')
                .setDescription('Remove timeout')
                .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('clear')
                .setDescription('Delete messages')
                .addIntegerOption(o => o.setName('amount').setDescription('1-100').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('say')
                .setDescription('Make bot say something')
                .addStringOption(o => o.setName('message').setDescription('Message').setRequired(true))
        )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function loadCommands() {
    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );
    console.log('Slash commands loaded!');
}

client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await loadCommands();
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const userId = message.author.id;

    if (!xpData[userId]) {
        xpData[userId] = {
            messages: 0,
            xp: 0,
            level: 1
        };
    }

    xpData[userId].messages += 1;

    if (xpData[userId].messages % 50 === 0) {
        xpData[userId].xp += 5;

        const neededXP = xpData[userId].level * 20;

        if (xpData[userId].xp >= neededXP) {
            xpData[userId].level += 1;

            const channel = message.guild.channels.cache.get(LEVEL_CHANNEL);

            if (channel) {
                channel.send(`🎉 Congratulations ${message.author}! You leveled up to **Level ${xpData[userId].level}**!`);
            }
        }

        saveXP();
    }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const addedRole = newMember.roles.cache.find(role =>
        !oldMember.roles.cache.has(role.id) &&
        RANK_ROLES.includes(role.id)
    );

    if (!addedRole) return;

    const channel = newMember.guild.channels.cache.get(LEVEL_CHANNEL);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor('Gold')
        .setTitle('🎉 RANK UP!')
        .setDescription(`Congratulations ${newMember}!\n\nYou ranked up to **${addedRole.name}**! 🚀`)
        .setThumbnail(newMember.user.displayAvatarURL())
        .setFooter({ text: 'Keep grinding!' })
        .setTimestamp();

    channel.send({ embeds: [embed] });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'help') {
        const embed = new EmbedBuilder()
            .setColor('Purple')
            .setTitle('🤖 OpBot Commands')
            .setDescription(
                '**/rank** - Check rank and XP\n' +
                '**/send** - Send bot message, use `\\n` for new line\n' +
                '**/roleset** - Give a rank role\n' +
                '**/mod kick** - Kick user\n' +
                '**/mod ban** - Ban user\n' +
                '**/mod timeout** - Timeout user\n' +
                '**/mod untimeout** - Remove timeout\n' +
                '**/mod clear** - Delete messages\n' +
                '**/mod say** - Bot says message'
            );

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.commandName === 'rank') {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);

        const rankRole = member.roles.cache
            .filter(role => RANK_ROLES.includes(role.id))
            .sort((a, b) => b.position - a.position)
            .first();

        const data = xpData[user.id] || { messages: 0, xp: 0, level: 1 };

        const embed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle('🏆 Rank')
            .setDescription(
                `${user}\n\n` +
                `Rank Role: **${rankRole ? rankRole.name : 'No rank'}**\n` +
                `Level: **${data.level}**\n` +
                `XP: **${data.xp}**\n` +
                `Messages: **${data.messages}**`
            )
            .setThumbnail(user.displayAvatarURL());

        return interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'send') {
        const message = interaction.options.getString('message').replace(/\\n/g, '\n');

        await interaction.channel.send(message);

        return interaction.reply({
            content: '✅ Message sent!',
            ephemeral: true
        });
    }

    if (interaction.commandName === 'roleset') {
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');

        if (!RANK_ROLES.includes(role.id)) {
            return interaction.reply({
                content: '❌ That is not a rank role.',
                ephemeral: true
            });
        }

        const member = await interaction.guild.members.fetch(user.id);

        await member.roles.add(role);

        return interaction.reply(`✅ Gave ${user} the rank **${role.name}**`);
    }

    if (interaction.commandName === 'mod') {
        const sub = interaction.options.getSubcommand();

        if (sub === 'kick') {
            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason given';
            const member = await interaction.guild.members.fetch(user.id);

            await member.kick(reason);
            return interaction.reply(`✅ Kicked ${user.tag}. Reason: ${reason}`);
        }

        if (sub === 'ban') {
            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason given';
            const member = await interaction.guild.members.fetch(user.id);

            await member.ban({ reason });
            return interaction.reply(`✅ Banned ${user.tag}. Reason: ${reason}`);
        }

        if (sub === 'timeout') {
            const user = interaction.options.getUser('user');
            const minutes = interaction.options.getInteger('minutes');
            const reason = interaction.options.getString('reason') || 'No reason given';
            const member = await interaction.guild.members.fetch(user.id);

            await member.timeout(minutes * 60 * 1000, reason);
            return interaction.reply(`✅ Timed out ${user.tag} for ${minutes} minutes.`);
        }

        if (sub === 'untimeout') {
            const user = interaction.options.getUser('user');
            const member = await interaction.guild.members.fetch(user.id);

            await member.timeout(null);
            return interaction.reply(`✅ Removed timeout from ${user.tag}.`);
        }

        if (sub === 'clear') {
            const amount = interaction.options.getInteger('amount');

            if (amount < 1 || amount > 100) {
                return interaction.reply({
                    content: '❌ Amount must be 1-100.',
                    ephemeral: true
                });
            }

            await interaction.channel.bulkDelete(amount, true);

            return interaction.reply({
                content: `✅ Deleted ${amount} messages.`,
                ephemeral: true
            });
        }

        if (sub === 'say') {
            const message = interaction.options.getString('message').replace(/\\n/g, '\n');

            await interaction.channel.send(message);

            return interaction.reply({
                content: '✅ Sent!',
                ephemeral: true
            });
        }
    }
});

client.login(TOKEN);