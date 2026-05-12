const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    SlashCommandBuilder,
    PermissionFlagsBits,
    Routes
} = require('discord.js');

const { REST } = require('@discordjs/rest');

const TOKEN = process.env.TOKEN;
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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const commands = [
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all bot commands'),

    new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Check your rank or another user rank')
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
                .setDescription('Message to send')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Moderation commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to kick')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to ban')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('timeout')
                .setDescription('Timeout a user for minutes')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to timeout')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('minutes')
                        .setDescription('Minutes')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Delete messages')
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Amount from 1 to 100')
                        .setRequired(true)
                )
        )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function loadCommands() {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
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

    const channel = newMember.guild.channels.cache.get(LEVEL_CHANNEL);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor('Gold')
        .setTitle('🎉 RANK UP!')
        .setDescription(
            `Congratulations ${newMember}!\n\n` +
            `You ranked up to **${addedRole.name}**! 🚀`
        )
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
                '**/rank** - Check your rank\n' +
                '**/send** - Send a message as the bot\n' +
                '**/mod kick** - Kick a user\n' +
                '**/mod ban** - Ban a user\n' +
                '**/mod timeout** - Timeout a user\n' +
                '**/mod clear** - Delete messages'
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.commandName === 'rank') {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);

        const rankRole = member.roles.cache
            .filter(role => RANK_ROLES.includes(role.id))
            .sort((a, b) => b.position - a.position)
            .first();

        const embed = new EmbedBuilder()
            .setColor(rankRole ? 'Gold' : 'Grey')
            .setTitle('🏆 Rank')
            .setDescription(
                rankRole
                    ? `${user} is ranked **${rankRole.name}**!`
                    : `${user} does not have a rank yet.`
            )
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'send') {
        const message = interaction.options.getString('message');

        await interaction.channel.send(message);

        return interaction.reply({
            content: '✅ Message sent!',
            ephemeral: true
        });
    }

    if (interaction.commandName === 'mod') {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'kick') {
            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason given';
            const member = await interaction.guild.members.fetch(user.id);

            await member.kick(reason);

            return interaction.reply(`✅ Kicked ${user.tag}. Reason: ${reason}`);
        }

        if (subcommand === 'ban') {
            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason given';
            const member = await interaction.guild.members.fetch(user.id);

            await member.ban({ reason });

            return interaction.reply(`✅ Banned ${user.tag}. Reason: ${reason}`);
        }

        if (subcommand === 'timeout') {
            const user = interaction.options.getUser('user');
            const minutes = interaction.options.getInteger('minutes');
            const reason = interaction.options.getString('reason') || 'No reason given';
            const member = await interaction.guild.members.fetch(user.id);

            await member.timeout(minutes * 60 * 1000, reason);

            return interaction.reply(`✅ Timed out ${user.tag} for ${minutes} minutes.`);
        }

        if (subcommand === 'clear') {
            const amount = interaction.options.getInteger('amount');

            if (amount < 1 || amount > 100) {
                return interaction.reply({
                    content: 'Amount must be between 1 and 100.',
                    ephemeral: true
                });
            }

            await interaction.channel.bulkDelete(amount, true);

            return interaction.reply({
                content: `✅ Deleted ${amount} messages.`,
                ephemeral: true
            });
        }
    }
});

client.login(TOKEN);