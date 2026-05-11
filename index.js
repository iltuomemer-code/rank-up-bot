const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

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

client.login(process.env.MTUwMzQzNDU4MTU2NTc3MTgyNw.Gx9jLZ.a9vD77YjqivgpwltwfGuiNabhpnLEP4dOspbLw);