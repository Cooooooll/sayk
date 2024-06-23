
// ████████╗███████╗███████╗████████╗██╗███████╗██╗   ██╗
// ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝██║██╔════╝╚██╗ ██╔╝
//    ██║   █████╗  ███████╗   ██║   ██║█████╗   ╚████╔╝ 
//    ██║   ██╔══╝  ╚════██║   ██║   ██║██╔══╝    ╚██╔╝  
//    ██║   ███████╗███████║   ██║   ██║██║        ██║   
//    ╚═╝   ╚══════╝╚══════╝   ╚═╝   ╚═╝╚═╝        ╚═╝   

// Developed by: Kkermit. All rights reserved. (2021)
// MIT License

const { 
    Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Permissions, MessageManager, Embed, Collection, Events, Partials, ActivityType, Activity, AuditLogEvent, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType
} = require(`discord.js`);
const fs = require('fs');
const config = require('./config')

// Version Control //

const currentVersion = `${config.botVersion}`;

let client;
try{
    client = new Client({ 
        intents: [
            GatewayIntentBits.Guilds, 
            GatewayIntentBits.GuildMessages, 
            GatewayIntentBits.MessageContent, 
            GatewayIntentBits.GuildMembers, 
            GatewayIntentBits.GuildPresences, 
            GatewayIntentBits.GuildIntegrations, 
            GatewayIntentBits.GuildWebhooks, 
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.MessageContent, 
            GatewayIntentBits.GuildEmojisAndStickers, 
            GatewayIntentBits.DirectMessages, 
            GatewayIntentBits.DirectMessageTyping, 
            GatewayIntentBits.GuildModeration, 
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildWebhooks, 
            GatewayIntentBits.AutoModerationConfiguration,
            GatewayIntentBits.GuildScheduledEvents, 
            GatewayIntentBits.GuildMessageTyping, 
            GatewayIntentBits.AutoModerationExecution, 
        ],  

        partials: [
            Partials.GuildMember, 
            Partials.Channel,
            Partials.GuildScheduledEvent,
            Partials.Message,
            Partials.Reaction, 
            Partials.ThreadMember, 
            Partials.User
        ],
    }); 
} catch (error) {
    console.error(`${color.red}[${getTimestamp()}]${color.reset} [ERROR] Error while creating the client. \n${color.red}[${getTimestamp()}]${color.reset} [ERROR]`, error);
};

client.logs = require('./utils/logs');
client.config = require('./config');

// Packages //

const { DisTube } = require("distube");
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const GiveawaysManager = require("./utils/giveaway");
const { handleLogs } = require("./events/handleLogs");
const Logs = require('discord-logs');
const { CaptchaGenerator } = require('captcha-canvas');
const { createCanvas } = require('canvas');
const { checkVersion } = require('./lib/version');

// Schemas //

const botSchema = require('./schemas/voiceChannelBotSystem');
const voiceSchema = require('./schemas/voiceChannelMembersSystem');
const levelSchema = require('./schemas/userLevelSystem');
const levelschema = require('./schemas/levelSetupSystem');
const roleSchema = require("./schemas/autoRoleSystem");
const capschema = require('./schemas/verifySystem');
const verifyusers = require('./schemas/verifyUsersSystem');
const linkSchema = require('./schemas/antiLinkSystem');
const warningSchema = require('./schemas/warningSystem');
const guildSettingsSchema = require('./schemas/prefixSystem');

// Rotating Activity //

client.on("ready", async (client) => {
    setInterval(() => {

        let activities = [
            { type: 'Watching', name: `${client.commands.size} slash commands!`},
            { type: 'Watching', name: `${client.pcommands.size} prefix commands!`},
            { type: 'Watching', name: `${client.guilds.cache.size} servers!`},
            { type: 'Watching', name: `${client.guilds.cache.reduce((a,b) => a+b.memberCount, 0)} members!`},
            { type: 'Playing', name: `${client.config.prefix}help | @${client.user.username}`},
        ];

        const status = activities[Math.floor(Math.random() * activities.length)];

        if (status.type === 'Watching') {
            client.user.setPresence({ activities: [{ name: `${status.name}`, type: ActivityType.Watching }]});
        } else {
            client.user.setPresence({ activities: [{ name: `${status.name}`, type: ActivityType.Playing }]});
        } 
    }, 7500);
    client.logs.success(`[STATUS] Rotating status loaded successfully.`);
});

// Status //

client.on("ready", () => {

    client.logs.success(`[STATUS] Bot status loaded as ${client.config.status}.`);
    client.user.setStatus(client.config.status);
});

require('./functions/processHandlers')();

client.commands = new Collection();
client.pcommands = new Collection();
client.aliases = new Collection();

require('dotenv').config();

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));
const triggerFiles = fs.readdirSync("./src/triggers").filter(file => file.endsWith(".js"));
const pcommandFolders = fs.readdirSync('./src/prefix');
const commandFolders = fs.readdirSync("./src/commands");

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./src/events");
    client.handleTriggers(triggerFiles, "./src/triggers")
    client.handleCommands(commandFolders, "./src/commands");
    client.prefixCommands(pcommandFolders, './src/prefix');
    client.login(process.env.token).then(() => {
        handleLogs(client)
        checkVersion(currentVersion);
    }).catch((error) => {
        console.error(`${color.red}[${getTimestamp()}]${color.reset} [LOGIN] Error while logging in. Check if your token is correct or double check your also using the correct intents. \n${color.red}[${getTimestamp()}]${color.reset} [LOGIN]`, error);
    });
})();

// Logging Effects //

const color = {
    red: '\x1b[31m',
    orange: '\x1b[38;5;202m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    pink: '\x1b[38;5;213m',
    torquise: '\x1b[38;5;45m',
    purple: '\x1b[38;5;57m',
    reset: '\x1b[0m'
}

function getTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Guild Create //

client.on("guildCreate", async guild => {
    const logchannelid = client.config.botJoinChannel;

    let theowner = process.env.devid; 
    const channel2 = await guild.channels.cache.random()
    const channelId = channel2.id;
    const invite = await guild.invites.create(channelId)

    await guild.fetchOwner().then(({ user }) => { theowner = user; }).catch(() => {});
    let embed = new EmbedBuilder()
    .setColor('Green')
    .setTitle(`__**Joined a New Server**__`)
    .setDescription(`${guild.name} has invited ${client.user.username} into their server`)
    .addFields(
        { name: "Guild Info", value: `>>> \`\`\`${guild.name} (${guild.id})\`\`\`` },
        { name: "Owner Info", value: `>>> \`\`\`${theowner ? `${theowner.tag} (${theowner.id})` : `${theowner} (${guild.ownerId})`}\`\`\`` },
        { name: "Member Count", value: `>>> \`\`\`${guild.memberCount}\`\`\`` },
        { name: "Server Number", value: `>>> \`\`\`${client.guilds.cache.size}\`\`\`` },
        { name: "Server Invite", value: `>>> \`\`\`${invite}\`\`\`` })
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setFooter({ text: `Orbit ${client.guilds.cache.size}`, iconURL: client.user.avatarURL({ dynamic: true }) })
    .setTimestamp();

    const LogChannel = client.channels.cache.get(logchannelid) || await client.channels.fetch(logchannelid).catch(() => {}) || false;
    if (LogChannel) LogChannel.send({ embeds: [embed] }).catch(console.warn);

console.log(`${color.orange}[${getTimestamp()}]${color.reset} [GUILD_CREATE] ${client.user.username} has been added to a new guild. \n${color.orange}> GuildName: ${guild.name} \n> GuildID: ${guild.id} \n> Owner: ${theowner ? `${theowner.tag} (${theowner.id})` : `${theowner} (${guild.ownerId})`} \n> MemberCount: ${guild.memberCount} \n> ServerNumber: ${client.guilds.cache.size} \n> ServerInvite: ${invite}`)
});

// Guild Delete //

client.on("guildDelete", async guild => {
    const logchannelid = client.config.botLeaveChannel;

    let theowner = process.env.devid;

    await guild.fetchOwner().then(({ user }) => { theowner = user; }).catch(() => {});
    let embed = new EmbedBuilder()
    .setColor('Red')
    .setTitle(`__**Left a Server**__`)
    .setDescription(`${guild.name} has kicked/ban ${client.user.username} out of their server`)
    .addFields(
        { name: "Guild Info", value: `>>> \`\`\`${guild.name} (${guild.id})\`\`\`` },
        { name: "Owner Info", value: `>>> \`\`\`${theowner ? `${theowner.tag} (${theowner.id})` : `${theowner} (${guild.ownerId})`}\`\`\`` },
        { name: "Member Count", value: `>>> \`\`\`${guild.memberCount}\`\`\`` },
        { name: "Server Number", value: `>>> \`\`\`${client.guilds.cache.size}\`\`\`` })
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setFooter({ text: `${client.user.username} ${client.guilds.cache.size}`, iconURL: client.user.avatarURL({ dynamic: true }) })
    .setTimestamp();

    const LogChannel = client.channels.cache.get(logchannelid) || await client.channels.fetch(logchannelid).catch(() => {}) || false;
    if (LogChannel) LogChannel.send({ embeds: [embed] }).catch(console.warn);

console.log(`${color.blue}[${getTimestamp()}]${color.reset} [GUILD_DELETE] ${client.user.username} has left a guild. \n${color.blue}> GuildName: ${guild.name} \n> GuildID: ${guild.id} \n> Owner: ${theowner ? `${theowner.tag} (${theowner.id})` : `${theowner} (${guild.ownerId})`} \n> MemberCount: ${guild.memberCount}`)
});

// Music System //

client.distube = new DisTube(client, {
    leaveOnStop: false,
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false,
    plugins: [
        new SpotifyPlugin({
            emitEventsAfterFetching: true
        }),
    new SoundCloudPlugin(),
    new YtDlpPlugin()
    ]
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return
    const prefix = client.config.prefix
    if (!message.content.startsWith(prefix)) return
    const args = message.content.slice(prefix.length).trim().split(/ +/g)
    const command = args.shift().toLowerCase()
    const cmd = client.pcommands.get(command) || client.pcommands.get(client.aliases.get(command))
    if (!cmd) return

    const noVoiceChannel = new EmbedBuilder()
        .setColor(client.config.embedMusic)
        .setDescription(`${client.config.musicEmojiError} | You **must** be in a voice channel!`)

    if (cmd.inVoiceChannel && !message.member.voice.channel) {
        return message.channel.send({ embeds: [noVoiceChannel] })
    }
    try {
    } catch {
        message.channel.send(`${client.config.musicEmojiError} | Error: \`${error}\``)
    }
})

const status = queue =>
    `Volume: \`${queue.volume}%\` | Filter: \`${queue.filters.names.join(', ') || 'Off'}\` | Loop: \`${queue.repeatMode ? (queue.repeatMode === 2 ? 'All Queue' : 'This Song') : 'Off'
    }\` | Autoplay: \`${queue.autoplay ? 'On' : 'Off'}\``
client.distube
    .on('playSong', (queue, song) =>
        queue.textChannel.send({
            embeds: [new EmbedBuilder().setColor(client.config.embedMusic)
                .setDescription(`🎶 | Playing \`${song.name}\` - \`${song.formattedDuration}\`\nRequested by: ${song.user
                    }\n${status(queue)}`)]
        })
    )
    .on('addSong', (queue, song) =>
        queue.textChannel.send(
            {
                embeds: [new EmbedBuilder().setColor(client.config.embedMusic)
                    .setDescription(`🎶 | Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`)]
            }
        )
    )
    .on('addList', (queue, playlist) =>
        queue.textChannel.send(
            {
                embeds: [new EmbedBuilder().setColor(client.config.embedMusic)
                    .setDescription(`🎶 | Added \`${playlist.name}\` playlist (${playlist.songs.length
                        } songs) to queue\n${status(queue)}`)]
            }
        )
    )
    .on('error', (channel, e) => {
        if (channel) channel.send(`⛔ | An error encountered: ${e.toString().slice(0, 1974)}`)
        else console.error(e)
    })
    .on('empty', channel => channel.send({
        embeds: [new EmbedBuilder().setColor(client.config.embedMusic)
            .setDescription('⛔ |Voice channel is empty! Leaving the channel...')]
    }))
    .on('searchNoResult', (message, query) =>
        message.channel.send(
            {
                embeds: [new EmbedBuilder().setColor(client.config.embedMusic)
                    .setDescription('`⛔ | No result found for \`${query}\`!`')]
            })
    )
    .on('finish', queue => queue.textChannel.send({
        embeds: [new EmbedBuilder().setColor(client.config.embedMusic)
            .setDescription('🏁 | Queue finished!')]
    }))

// Command Logging //

client.on(Events.InteractionCreate, async interaction => {

    if (!interaction) return;
    if (!interaction.isChatInputCommand()) return;
    else {

        const channel = await client.channels.cache.get(client.config.slashCommandLoggingChannel);
        const server = interaction.guild.name;
        const user = interaction.user.username;
        const userID = interaction.user.id;

        const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setAuthor({ name: `${user} has used a command.`, iconURL: client.user.avatarURL({ dynamic: true })})
        .setTitle(`${client.user.username} Command Logger ${client.config.arrowEmoji}`)
        .addFields({ name: 'Server Name', value: `${server}`})
        .addFields({ name: 'Command', value: `\`\`\`${interaction}\`\`\``})
        .addFields({ name: 'User', value: `${user} | ${userID}`})
        .setTimestamp()
        .setFooter({ text: `Command Logger ${client.config.devBy}`, iconURL: interaction.user.avatarURL({ dynamic: true })})

        await channel.send({ embeds: [embed] });
    }
})

client.on(Events.MessageCreate, async message => {

    const prefix = client.config.prefix
    if (!message.author.bot && message.content.startsWith(prefix)) {

        const channel = await client.channels.cache.get(client.config.prefixCommandLoggingChannel);
        const server = message.guild.name;
        const user = message.author.username;
        const userID = message.author.id;

        const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setAuthor({ name: `${user} has used a command.`, iconURL: client.user.avatarURL({ dynamic: true }) })
        .setTitle(`${client.user.username} Command Logger ${client.config.arrowEmoji}`)
        .addFields({ name: 'Server Name', value: `${server}` })
        .addFields({ name: 'Command', value: `\`\`\`${message.content}\`\`\`` })
        .addFields({ name: 'User', value: `${user} | ${userID}` })
        .setTimestamp()
        .setFooter({ text: `Command Logger ${client.config.devBy}`, iconURL: message.author.avatarURL({ dynamic: true }) })

        await channel.send({ embeds: [embed] });
    }
});

// Total Bots Voice Channel Code //

client.on(Events.GuildMemberAdd, async (member, err) => {

    if (member.guild === null) return;
    const botData = await botSchema.findOne({ Guild: member.guild.id });

    if (!botData) return;
    else {

        const botVoiceChannel = member.guild.channels.cache.get(botData.BotChannel);
        if (!botVoiceChannel || botVoiceChannel === null) return;
        const botsList = member.guild.members.cache.filter(member => member.user.bot).size;

        botVoiceChannel.setName(`• Total Bots: ${botsList}`).catch(err);

    }
})

client.on(Events.GuildMemberRemove, async (member, err) => {

    if (member.guild === null) return;
    const botData1 = await botSchema.findOne({ Guild: member.guild.id });

    if (!botData1) return;
    else {

        const botVoiceChannel1 = member.guild.channels.cache.get(botData1.BotChannel);
        if (!botVoiceChannel1 || botVoiceChannel1 === null) return;
        const botsList1 = member.guild.members.cache.filter(member => member.user.bot).size;

        botVoiceChannel1.setName(`• Total Bots: ${botsList1}`).catch(err);
    
    }
})

// Member Voice Channels Code //

client.on(Events.GuildMemberAdd, async (member, err) => {

    if (member.guild === null) return;
    const voiceData = await voiceSchema.findOne({ Guild: member.guild.id });

    if (!voiceData) return;
    else {

        const totalVoiceChannel = member.guild.channels.cache.get(voiceData.TotalChannel);
        if (!totalVoiceChannel || totalVoiceChannel === null) return;
        const totalMembers = member.guild.memberCount;

        totalVoiceChannel.setName(`• Total Members: ${totalMembers}`).catch(err);
    }
})

client.on(Events.GuildMemberRemove, async (member, err) => {

    if (member.guild === null) return;
    const voiceData1 = await voiceSchema.findOne({ Guild: member.guild.id });

    if (!voiceData1) return;
    else {

        const totalVoiceChannel1 = member.guild.channels.cache.get(voiceData1.TotalChannel);
        if (!totalVoiceChannel1 || totalVoiceChannel1 === null) return;
        const totalMembers1 = member.guild.memberCount;

        totalVoiceChannel1.setName(`• Total Members: ${totalMembers1}`).catch(err);
    }
})

// Leveling System //

client.on(Events.MessageCreate, async (message, err) => {

    const { guild, author } = message;
    if (message.guild === null) return;
    const leveldata = await levelschema.findOne({ Guild: message.guild.id });

    if (!leveldata || leveldata.Disabled === 'disabled') return;
    let multiplier = 1;
    
    multiplier = Math.floor(leveldata.Multi);
    

    if (!guild || author.bot) return;

    levelSchema.findOne({ Guild: guild.id, User: author.id}, async (err, data) => {

        if (err) throw err;

        if (!data) {
            levelSchema.create({
                Guild: guild.id,
                User: author.id,
                XP: 0,
                Level: 0
            })
        }
    })

    const channel = message.channel;
    const give = 1;
    const data = await levelSchema.findOne({ Guild: guild.id, User: author.id});

    if (!data) return;

    const requiredXP = data.Level * data.Level * 20 + 20;

    if (data.XP + give >= requiredXP) {

        data.XP += give;
        data.Level += 1;
        await data.save();
        
        if (!channel) return;

        const levelEmbed = new EmbedBuilder()
        .setColor(client.config.embedLevels)
        .setAuthor({ name: `Leveling System ${client.config.devBy}` })
        .setTitle(`> ${client.user.username} Leveling System ${client.config.arrowEmoji}`)
        .setDescription(`\`\`\`${author.username} has leveled up to level ${data.Level}!\`\`\``)
        .setThumbnail(author.avatarURL({ dynamic: true }))
        .setFooter({ text: `${author.username} Leveled Up`})
        .setTimestamp()

        await message.channel.send({ embeds: [levelEmbed] }).catch(err => client.logs.error('[LEVEL_ERROR] Error sending level up message!'));
    } else {

        if(message.member.roles.cache.find(r => r.id === leveldata.Role)) {
            data.XP += give * multiplier;
        } data.XP += give;
        data.save();
    }
})

// Auto Role System //

client.on("guildMemberAdd", async member => {
    const { guild } = member;

    const data = await roleSchema.findOne({ GuildID: guild.id });
    if (!data) return;
    if (data.Roles.length < 0) return;
    for (const r of data.Roles) {
        await member.roles.add(r);
    }
})

// Giveaway Manager //

client.giveawayManager = new GiveawaysManager(client, {
    default: {
        botsCanWin: false,
        embedColor: "#a200ff",
        embedColorEnd: "#550485",
        reaction: "🎉",
    },
});

// Audit Logging System //

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on("uncaughtException", (err) => {
    console.log("Uncaught Exception:", err);
});

Logs(client, {
    debug: true
});

// Verify System //

client.on(Events.InteractionCreate, async interaction => {

    if (interaction.customId === 'verify') {

        if (interaction.guild === null) return;

        const verifydata = await capschema.findOne({ Guild: interaction.guild.id });
        const verifyusersdata = await verifyusers.findOne({ Guild: interaction.guild.id, User: interaction.user.id });

        if (!verifydata) return await interaction.reply({ content: `The **verification system** has been disabled in this server!`, ephemeral: true});

        if (verifydata.Verified.includes(interaction.user.id)) return await interaction.reply({ content: 'You have **already** been verified!', ephemeral: true});
        
        function generateCaptcha(length) {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let captcha = '';
            for (let i = 0; i < length; i++) {
                captcha += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return captcha;
        }

        async function generateCaptchaImage(text) {
            const canvas = createCanvas(450,150);
            const ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#FF0000'; 
            ctx.font = 'bold 100px Arial'; 
            ctx.textAlign = 'center'; 
            ctx.textBaseline = 'middle';
            ctx.fillText(text, canvas.width / 2, canvas.height / 2); 

            return canvas.toBuffer();
        }

        const captchaText = generateCaptcha(5); 
        generateCaptchaImage(captchaText).then(async (buffer) => {

            const attachment = new AttachmentBuilder(buffer, { name: `captcha.png`});

            const verifyembed = new EmbedBuilder()
            .setColor(client.config.embedVerify)
            .setAuthor({ name: `Verification System ${client.config.devBy}`})
            .setFooter({ text: `Verification Captcha`})
            .setTimestamp()
            .setImage('attachment://captcha.png')
            .setThumbnail(interaction.guild.iconURL())
            .setTitle('> Verification Step: Captcha')
            .setDescription(`**Verify value**: \n> *Please use the button bellow to submit your captcha!*`)
        
            const verifybutton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setLabel('Enter Captcha')
                .setStyle(ButtonStyle.Success)
                .setCustomId('captchaenter')
            )

            await interaction.reply({ embeds: [verifyembed], components: [verifybutton], files: [attachment], ephemeral: true });
        
            if (verifyusersdata) {

                await verifyusers.deleteMany({
                    Guild: interaction.guild.id,
                    User: interaction.user.id
                })
                await verifyusers.create ({
                    Guild: interaction.guild.id,
                    User: interaction.user.id,
                    Key: captchaText
                })
            } else {
                await verifyusers.create ({
                    Guild: interaction.guild.id,
                    User: interaction.user.id,
                    Key: captchaText
                })
            }
        })
        .catch(error => {
            client.logs.error('[VERIFY_ERROR] An error occurred while generating the captcha:', error);
        });
    } else if (interaction.customId === 'captchaenter') {
        const vermodal = new ModalBuilder()
            .setTitle(`Verification`)
            .setCustomId('vermodal')

            const answer = new TextInputBuilder()
            .setCustomId('answer')
            .setRequired(true)
            .setLabel('Please submit your Captcha code')
            .setPlaceholder(`Your captcha code input`)
            .setStyle(TextInputStyle.Short)

            const vermodalrow = new ActionRowBuilder().addComponents(answer);
            vermodal.addComponents(vermodalrow);

        await interaction.showModal(vermodal);
    } else if (interaction.customId === 'vermodal') {
        if (!interaction.isModalSubmit()) return;

        const userverdata = await verifyusers.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
        const verificationdata = await capschema.findOne({ Guild: interaction.guild.id });
    
        if (verificationdata.Verified.includes(interaction.user.id)) return await interaction.reply({ content: `You have **already** verified within ${interaction.guild.name}!`, ephemeral: true});
    
        const modalanswer = interaction.fields.getTextInputValue('answer');
        if (modalanswer === userverdata.Key) {
    
            const verrole = interaction.guild.roles.cache.get(verificationdata.Role);
    
            try {
                await interaction.member.roles.add(verrole);
            } catch (err) {
                return await interaction.reply({ content: `There was an **issue** giving you the **<@&${verificationdata.Role}>** role, try again later!`, ephemeral: true})
            }

            await capschema.updateOne({ Guild: interaction.guild.id }, { $push: { Verified: interaction.user.id }});
            try {
                await interaction.reply({ content: 'You have been **verified!**', ephemeral: true});
            } catch (err) {
                client.logs.error(`[VERIFY_ERROR] Error replying to the user that he has been verified!`);
                return;
            } 
        } else {
            await interaction.reply({ content: `**Oops!** It looks like you **didn't** enter the valid **captcha code**!`, ephemeral: true})
        }
    }
});

client.on('guildMemberRemove', async member => {
    try {
        const userId = member.user.id;
        const userverdata = await verifyusers.findOne({ Guild: member.guild.id, User: userId });
        const verificationdata = await capschema.findOne({ Guild: member.guild.id });
        if (userverdata && verificationdata) {
            await capschema.updateOne({ Guild: member.guild.id },{ $pull: { Verified: userId } });
            await verifyusers.deleteOne({ Guild: member.guild.id, User: userId });
        }
    } catch (err) {
        client.logs.error(`[VERIFY_ERROR] Error deleting the data from the user that left the server!`);
    }
});

// Anti Link System //

client.on(Events.MessageCreate, async (message) => {

    if (message.guild === null) return;
    
    if (message.content.startsWith('http') || message.content.startsWith('discord.gg') || message.content.includes('https://') || message.content.includes('http://') || message.content.includes('discord.gg/') || message.content.includes('www.') || message.content.includes('.net') || message.content.includes('.com')) {

        const Data = await linkSchema.findOne({ Guild: message.guild.id });

        if (!Data) return;

        const memberPerms = Data.Perms;

        const user = message.author;
        const member = message.guild.members.cache.get(user.id);

        const embed = new EmbedBuilder()
        .setColor(client.config.embedModHard)
        .setAuthor({ name: `Anti-link system ${client.config.devBy}`})
        .setTitle(`${client.config.modEmojiHard} ${client.user.username} Anti-link system ${client.config.arrowEmoji}`)
        .setDescription(`> Link detected and deleted successfully! \n> ${message.author}, links are **disabled** in **${message.guild.name}**. Please **do not** send links in this server!`)
        .setFooter({ text: 'Anti-link detected a link'})
        .setThumbnail(client.user.avatarURL())
        .setTimestamp()

        if (member.permissions.has(memberPerms)) return;
        else {
            await message.channel.send({ embeds: [embed] }).then (msg => {
                setTimeout(() => msg.delete(), 5000)
            })

            ;(await message).delete();

            warningSchema.findOne({ GuildID: message.guild.id, UserID: message.author.id, UserTag: message.author.tag }, async (err, data) => {

                if (err) throw err;
    
                if (!data) {
                    data = new warningSchema({
                        GuildID: message.guild.id,
                        UserID: message.author.id,
                        UserTag: message.author.tag,
                        Content: [
                            {
                                ExecuterId: '1211784897627168778',
                                ExecuterTag: 'Testify#0377',
                                Reason: 'Use of forbidden links'
                            }
                        ],
                    });
                } else {
                    const warnContent = {
                        ExecuterId: '1211784897627168778',
                        ExecuterTag: 'Testify#0377',
                        Reason: 'Use of forbidden links'
                    }
                    data.Content.push(warnContent);
                }
                data.save()
            })
        }
    }
})

// Advanced Help Menu //

client.on(Events.InteractionCreate, async (interaction, err) => {

    const helprow2 = new ActionRowBuilder()
        .addComponents(

            new StringSelectMenuBuilder()
            .setMinValues(1)
            .setMaxValues(1)
            .setCustomId('selecthelp')
            .setPlaceholder('• Select a menu')
            .addOptions(
                {
                    label: '• Help Center',
                    description: 'Navigate to the Help Center.',
                    value: 'helpcenter',
                },

                {
                    label: '• How to add the bot',
                    description: `Displays how to add ${client.user.username} to your amazing server.`,
                    value: 'howtoaddbot'
                },

                {
                    label: '• Feedback',
                    description: `Displays how to contribute to the development of ${client.user.username} by giving feedback.`,
                    value: 'feedback'
                },

                {
                    label: '• Commands Help',
                    description: 'Navigate to the Commands help page.',
                    value: 'commands',
                },
                {
                    label: '• Prefix Commands Help',
                    description: 'Navigate to the Prefix Commands help page.',
                    value: 'pcommands',
                }
            ),
        );

    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId === 'selecthelp') {
        let choices = "";
        const fetchGuildPrefix = await guildSettingsSchema.findOne({ Guild: interaction.guild.id });
        const guildPrefix = fetchGuildPrefix.Prefix;

        const centerembed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle(`${client.user.username} Help Center ${client.config.arrowEmoji}`)
        .setAuthor({ name: `🚑 Help Command ${client.config.devBy}`})
        .setFooter({ text: `🚑 ${client.user.username}'s help center`})
        .setThumbnail(client.user.avatarURL())
        .addFields({ name: `• Commands Help`, value: `> Get all **Commands** (**${client.commands.size}** slash & **${client.pcommands.size}** prefix) ${client.user.username} looks over!`})
        .addFields({ name: `• What's my prefix?`, value: `> The prefix for **${interaction.guild.name}** is \`\`${guildPrefix}\`\``})
        .addFields({ name: "• How to add Bot", value: `> Quick guide on how to add our **${client.user.username}** \n> to your server.`})
        .addFields({ name: "• Feedback", value: "> How to send us feedback and suggestions."})
        .addFields({ name: "• Exclusive Functionality", value: `> Guide on how to receive permission to \n> use exclusive functionality (${client.user.username} Beta version).`})
        .setTimestamp();

        interaction.values.forEach(async (value) => {
            choices += `${value}`;

            if (value === 'helpcenter') {

                setTimeout(() => {
                    interaction.update({ embeds: [centerembed] }).catch(err);
                }, 100)

            }

            if (value === 'howtoaddbot') {

                setTimeout(() => {
                    const howtoaddembed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle(`${client.user.username} Help Center ${client.config.arrowEmoji}`)
                    .setDescription(`> **How to add ${client.user.username} to your server**`)
                    .setAuthor({ name: `🚑 Help Command ${client.config.devBy}`})
                    .setFooter({ text: `🚑 ${client.user.username}'s help center: Adding bot`})
                    .setThumbnail(client.user.avatarURL())
                    .addFields({ name: `• How to add ${client.user.username} to your server`, value: `> To add ${client.user.username} to your server, simple click on the bots profile and click, \`\`add app\`\`.` })
                    .addFields({ name: "• Wait.. what Official Discord server..", value: "> This is our Discord server: https://discord.gg/xcMVwAVjSD" })
                    .addFields({ name: "• Our official website..", value: "> This is our official website: https://testify.lol "})
                    .setTimestamp();

                    interaction.update({ embeds: [howtoaddembed] }).catch(err);
                }, 100)
            }

            if (value === 'feedback') {

                setTimeout(() => {
                    const feedbackembed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle(`${client.user.username} Help Center ${client.config.arrowEmoji}`)
                    .setDescription(`> **How to give feedback on ${client.user.username}**`)
                    .setAuthor({ name: `🚑 Help Command ${client.config.devBy}` })
                    .setFooter({ text: `🚑 ${client.user.username}'s help center: Sending feedback` })
                    .setThumbnail(client.user.avatarURL())
                    .addFields({ name: "• How can I give Feedback?", value: `> The creator of ${client.user.username} appreciates your opinion on our the bot. To send feedback or suggestions, use the command below. \n > Alternatively, if you spot or come across a bug, be sure to report it to us with the command below.` })
                    .addFields({ name: "• /suggestion", value: "> Opens up a suggestion form" })
                    .addFields({ name: "• /bug-report", value: "> Opens a bug report" })
                    .setTimestamp();

                    interaction.update({ embeds: [feedbackembed] }).catch(err);
                }, 100)
            }

            if (value === 'commands') {

                const commandpage1 = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle(`${client.user.username} Help Center ${client.config.arrowEmoji}`)
                    .setAuthor({ name: `🚑 Help Command ${client.config.devBy}` })
                    .setFooter({ text: `🚑 ${client.user.username}'s help center: Commands Page 1` })
                    .setThumbnail(client.user.avatarURL())
                    .setDescription(`> **Commands Help Page \`\`1\`\`**`)
                    .addFields({ name: "• /account-view", value: "> View your economy account information." })
                    .addFields({ name: "• /add emoji", value: "> Adds an emoji to the server." })
                    .addFields({ name: "• /add sticker", value: "> Adds a sticker to the server." })
                    .addFields({ name: "• /advice", value: "> Gives you a random piece of advice." })
                    .addFields({ name: "• /animal-facts", value: "> Gives you a random animal fact." })
                    .addFields({ name: "• /announce", value: "> Announces a message in a specified channel." })
                    .addFields({ name: "• /ascii", value: "> Converts text to ascii." })
                    .addFields({ name: "• /automod flagged-words", value: "> Sets up the automod system for flagged words." })
                    .addFields({ name: "• /automod keyword", value: "> Sets up the automod system for keywords." })
                    .addFields({ name: "• /automod mention-spam", value: "> Sets up the automod system for mention-spam." })
                    .addFields({ name: "• /automod spam-messages", value: "> Sets up the automod system for spam-messages." })
                    .addFields({ name: "• /autorole-add", value: "> Adds a role to the autorole system." })
                    .addFields({ name: "• /autorole-disable", value: "> Disables the autorole system." })
                    .addFields({ name: "• /autorole-enable", value: "> Enables the autorole system." })
                    .addFields({ name: "• /autorole-remove", value: "> Removes a role from the autorole system." })
                    .addFields({ name: "• /avatar", value: "> Shows a users avatar." })
                    .addFields({ name: "• /ban", value: "> Bans a user for a specified reason." })
                    .addFields({ name: "• /beg", value: "> Beg for money. Results may vary." })
                    .addFields({ name: "• /bot-specs", value: "> Shows the bots specifications." })
                    .addFields({ name: "• /bot-uptime", value: "> Shows the bots current uptimes." })
                    .addFields({ name: "• /bug-report", value: "> Opens a bug report." })
                    .addFields({ name: "• /calculate", value: "> Calculates a math problem." })
                    .addFields({ name: "• /chat", value: "> Chat with an AI modal." })
                    .addFields({ name: "• /change-prefix", value: "> Changes the bots prefix in your server." })
                    .addFields({ name: "• /clear", value: "> Clears a specified amount of messages." })
                    .addFields({ name: "• /coin-flip", value: "> Flips a coin." })

                    .setImage('https://i.postimg.cc/8CbGp6D5/Screenshot-300.png')
                    .setTimestamp();

                const commandpage2 = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle(`${client.user.username} Help Center ${client.config.arrowEmoji}`)
                    .setAuthor({ name: `🚑 Help Command ${client.config.devBy}` })
                    .setFooter({ text: `🚑 ${client.user.username}'s help center: Commands Page 2` })
                    .setThumbnail(client.user.avatarURL())
                    .setDescription(`> **Commands Help Page \`\`2\`\`**`)
                    .addFields({ name: "• /counting disable", value: "> Disables the counting system." })
                    .addFields({ name: "• /counting enable", value: "> Enables the counting system." })
                    .addFields({ name: "• /create embed", value: "> Creates an embed." })
                    .addFields({ name: "• /create thread", value: "> Creates a thread." })
                    .addFields({ name: "• /dad-joke", value: "> Tells a dad joke." })
                    .addFields({ name: "• /daily", value: "> Collect your daily reward." })
                    .addFields({ name: "• /deposit", value: "> Deposits a specified amount of balance to the bank." })
                    .addFields({ name: "• /dictionary", value: "> Searches the dictionary for a word." })
                    .addFields({ name: "• /economy-create account", value: "> Creates an economy account." })
                    .addFields({ name: "• /economy-delete account", value: "> Deletes an economy account." })
                    .addFields({ name: "• /fake-tweet", value: "> Creates a fake tweet." })
                    .addFields({ name: "• /fast-type", value: "> Starts a fast type game." })
                    .addFields({ name: "• /gamble", value: "> Gambles a specified amount of balance." })
                    .addFields({ name: "• /give currency", value: "> Gives a specified user a specified amount of currency." })
                    .addFields({ name: "• /give xp", value: "> Gives a specified user a specified amount of XP." })
                    .addFields({ name: "• /giveaway edit", value: "> edits the current giveaway." })
                    .addFields({ name: "• /giveaway end", value: "> Ends the current giveaway." })
                    .addFields({ name: "• /giveaway reroll", value: "> Rerolls the current giveaway." })
                    .addFields({ name: "• /giveaway start", value: "> Starts a giveaway." })
                    .addFields({ name: "• /guess the pokemon", value: "> Starts a game of guess the pokemon." })
                    .addFields({ name: "• /hack", value: "> Hacks a user (fake)." }) 
                    .addFields({ name: "• /help manual", value: "> Displays the help menu." })
                    .addFields({ name: "• /help server", value: "> Displays the help server." })
                    .addFields({ name: "• /how drunk", value: "> Displays how drunk you are." })
                    .addFields({ name: "• /how gay", value: "> Displays how gay you are." })

                    .setImage('https://i.postimg.cc/8CbGp6D5/Screenshot-300.png')
                    .setTimestamp();

                const commandpage3 = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle(`${client.user.username} Help Center ${client.config.arrowEmoji}`)
                    .setAuthor({ name: `🚑 Help Command ${client.config.devBy}` })
                    .setFooter({ text: `🚑 ${client.user.username}'s help center: Commands Page 3` })
                    .setThumbnail(client.user.avatarURL())
                    .setDescription(`> **Commands Help Page \`\`3\`\`**`)
                    .addFields({ name: "• /how high", value: "> Displays how high you are." })
                    .addFields({ name: "• /how simp", value: "> Displays how much of a simp you are." })
                    .addFields({ name: "• /how stupid", value: "> Displays how stupid you are." })
                    .addFields({ name: "• /how sus", value: "> Displays how sus you are." })
                    .addFields({ name: "• /impersonate", value: "> Impersonates a user." })
                    .addFields({ name: "• /iq", value: "> Displays your IQ." })
                    .addFields({ name: "• /khalid-quote", value: "> Displays a random Khalid quote." })
                    .addFields({ name: "• /kick", value: "> Kicks a user for a specified reason." })
                    .addFields({ name: "• /latency", value: "> Displays the bots latency." })
                    .addFields({ name: "• /leaderboard", value: "> Displays the server leaderboard." })
                    .addFields({ name: "• /leveling-system disable", value: "> Disables leveling for the server." })
                    .addFields({ name: "• /leveling-system disable-multiplier", value: "> Disables the leveling multiplier." })
                    .addFields({ name: "• /leveling-system enable", value: "> Enables leveling for the server." })
                    .addFields({ name: "• /leveling-system role-multiplier", value: "> Sets up a leveling multiplier role." })
                    .addFields({ name: "• /lock", value: "> Locks a channel." })
                    .addFields({ name: "• /logs-disable", value: "> Disables the logs." })
                    .addFields({ name: "• /logs-setup", value: "> Enables the logs." })
                    .addFields({ name: "• /lyrics", value: "> Displays the lyrics of a song." })
                    .addFields({ name: "• /master-oogway", value: "> Generate a quote from master oogway." })
                    .addFields({ name: "• /member-count", value: "> Displays the server member count." })
                    .addFields({ name: "• /members-vc bot-remove", value: "> Disables the total bots voice channel." })
                    .addFields({ name: "• /members-vc bot-set", value: "> Sets up the total bots voice channel." })
                    .addFields({ name: "• /members-vc total-remove", value: "> Disables the total members voice channel." })
                    .addFields({ name: "• /members-vc total-set", value: "> Sets up the total members voice channel." })
                    .addFields({ name: "• /meme", value: "> Displays a random meme." })

                    .setImage('https://i.postimg.cc/8CbGp6D5/Screenshot-300.png')
                    .setTimestamp();

                const commandpage4 = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle(`${client.user.username} Help Center ${client.config.arrowEmoji}`)
                    .setAuthor({ name: `🚑 Help Command ${client.config.devBy}` })
                    .setFooter({ text: `🚑 ${client.user.username}'s help center: Commands Page 4` })
                    .setThumbnail(client.user.avatarURL())
                    .setDescription(`> **Commands Help Page \`\`4\`\`**`)
                    .addFields({ name: "• /minecraft-server", value: "> Displays information about a minecraft server." })
                    .addFields({ name: "• /minecraft-skin", value: "> Displays the skin of a minecraft user." })
                    .addFields({ name: "• /minigame 2048", value: "> Starts a game of 2048." })
                    .addFields({ name: "• /minigame connect4", value: "> Starts a game of connect4." })
                    .addFields({ name: "• /minigame find-emoji", value: "> Starts a game of find-emoji." })
                    .addFields({ name: "• /minigame flood", value: "> Starts a game of flood-it." })
                    .addFields({ name: "• /minigame hangman", value: "> Starts a game of hangman." })
                    .addFields({ name: "• /minigame match-pairs", value: "> Starts a game of match-pairs." })
                    .addFields({ name: "• /minigame minesweeper", value: "> Starts a game of minesweeper." })
                    .addFields({ name: "• /minigame rps", value: "> Starts a game of rock-paper-scissors." })
                    .addFields({ name: "• /minigame slots", value: "> Starts a game of slots." })
                    .addFields({ name: "• /minigame snake", value: "> Starts a game of snake." })
                    .addFields({ name: "• /minigame tictactoe", value: "> Starts a game of tictactoe." })
                    .addFields({ name: "• /minigame wordle", value: "> Starts a game of wordle." })
                    .addFields({ name: "• /minigame would-you-rather", value: "> Starts a game of would you rather." })
                    .addFields({ name: "• /mod-panel", value: "> Opens the moderation panel." })
                    .addFields({ name: "• /movie-tracker", value: "> Displays info about a given movie" })
                    .addFields({ name: "• /mute", value: "> Mutes a user for a specified reason." })
                    .addFields({ name: "• /nick", value: "> Changes a users nickname." })
                    .addFields({ name: "• /nitro", value: "> Generates a nitro code. (fake)" })
                    .addFields({ name: "• /pepe-sign", value: "> Generates a pepe sign." })
                    .addFields({ name: "• /permissions", value: "> Displays a users permissions." })
                    .addFields({ name: "• /ping", value: "> Displays the bots ping." })
                    .addFields({ name: "• /pp-size", value: "> Displays your pp size." })
                    .addFields({ name: "• /prefix-help", value: "> Displays the prefix help." })

                    .setImage('https://i.postimg.cc/8CbGp6D5/Screenshot-300.png')
                    .setTimestamp();

                const commandpage5 = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle(`${client.user.username} Help Center ${client.config.arrowEmoji}`)
                    .setAuthor({ name: `🚑 Help Command ${client.config.devBy}` })
                    .setFooter({ text: `🚑 ${client.user.username}'s help center: Commands Page 5` })
                    .setThumbnail(client.user.avatarURL())
                    .setDescription(`> **Commands Help Page \`\`5\`\`**`)
                    .addFields({ name: "• /profile-create", value: "> Creates a users profile." })
                    .addFields({ name: "• /profile-edit", value: "> Edits a users profile." })
                    .addFields({ name: "• /profile-view", value: "> Views a users profile." })
                    .addFields({ name: "• /radio", value: "> Plays a radio station in a voice channel." })
                    .addFields({ name: "• /rank", value: "> Displays a users rank." })
                    .addFields({ name: "• /relationship-checker", value: "> Displays a users relationship status with another user." })
                    .addFields({ name: "• /reset all-currency", value: "> Resets all economy currency for the server." })
                    .addFields({ name: "• /reset all-xp", value: "> Resets all economy XP for the server." })
                    .addFields({ name: "• /reset currency", value: "> Resets a users economy currency." })
                    .addFields({ name: "• /reset xp", value: "> Resets a users economy XP." })
                    .addFields({ name: "• /rob", value: "> Robs a user for a specified amount." })
                    .addFields({ name: "• /role-add", value: "> Adds a role to a user." })
                    .addFields({ name: "• /role-remove", value: "> Removes a role from a user." })
                    .addFields({ name: "• /role-info", value: "> Displays information about a role." })
                    .addFields({ name: "• /say", value: "> Makes the bot say a message." })
                    .addFields({ name: "• /server-info", value: "> Displays information about the server." })
                    .addFields({ name: "• /slow-mode-check", value: "> Checks the slowmode of a channel." })
                    .addFields({ name: "• /slow-mode-off", value: "> Disables the slowmode of a channel." })
                    .addFields({ name: "• /slow-mode-set", value: "> Sets the slowmode of a channel." })
                    .addFields({ name: "• /soundboard", value: "> Plays a sound in a voice channel." })
                    .addFields({ name: "• /spotify", value: "> Displays information about a spotify track the users listing to." })
                    .addFields({ name: "• /sticky-message-check", value: "> Displays active sticky message(s)." })
                    .addFields({ name: "• /sticky-message-disable", value: "> Disables the sticky message system." })
                    .addFields({ name: "• /sticky-message-enable", value: "> Enables the sticky message system." })
                    .addFields({ name: "• /suggest", value: "> Suggests a feature for the bot." })
                    
                    .setImage('https://i.postimg.cc/8CbGp6D5/Screenshot-300.png')
                    .setTimestamp();

                const commandpage6 = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle(`${client.user.username} Help Center ${client.config.arrowEmoji}`)
                    .setAuthor({ name: `🚑 Help Command ${client.config.devBy}` })
                    .setFooter({ text: `🚑 ${client.user.username}'s help center: Commands Page 6` })
                    .setThumbnail(client.user.avatarURL())
                    .setDescription(`> **Commands Help Page \`\`6\`\`**`)
                    .addFields({ name: "• /test", value: "> Tests the bot." })
                    .addFields({ name: "• /translate", value: "> Translates a message." })
                    .addFields({ name: "• /tts", value: "> Text to speech." })
                    .addFields({ name: "• /unban", value: "> Unbans a user." })
                    .addFields({ name: "• /unlock", value: "> Unlocks a channel." })
                    .addFields({ name: "• /unmute", value: "> Unmutes a user." })
                    .addFields({ name: "• /user-info", value: "> Displays information about a user." })
                    .addFields({ name: "• /verify-disable", value: "> Disables the verification system." })
                    .addFields({ name: "• /verify-setup", value: "> Enables the verification system." })
                    .addFields({ name: "• /warn clear", value: "> Warns a user." })
                    .addFields({ name: "• /warn create", value: "> Creates a warning." })
                    .addFields({ name: "• /warn edit", value: "> Edits a warning." })
                    .addFields({ name: "• /warn info", value: "> Displays information about a warning." })
                    .addFields({ name: "• /warn list", value: "> Lists all warnings." })
                    .addFields({ name: "• /warn remove", value: "> Removes a warning." })
                    .addFields({ name: "• /welcome-system remove", value: "> Disables the welcome system." })
                    .addFields({ name: "• /welcome-system set", value: "> Enables the welcome system." })
                    .addFields({ name: "• /wiki", value: "> Searches wikipedia for a query." })
                    .addFields({ name: "• /wipe-user-data", value: "> Wipes a users data." })
                    .addFields({ name: "• /withdraw", value: "> Withdraws a specified amount of balance from the bank." })
                    .addFields({ name: "• /work", value: "> Work for money." })

                    .setImage('https://i.postimg.cc/8CbGp6D5/Screenshot-300.png')
                    .setTimestamp();

                const commandpage7 = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle(`${client.user.username} Help Center ${client.config.arrowEmoji}`)
                    .setAuthor({ name: `🚑 Help Command ${client.config.devBy}` })
                    .setFooter({ text: `🚑 ${client.user.username}'s help center: Commands Page 7` })
                    .setThumbnail(client.user.avatarURL())
                    .setDescription(`> **Commands Help Page \`\`7\`\`**`)
                    .addFields({ name: '• /prefix change', value: '> Changes the bots prefix.'})
                    .addFields({ name: '• /prefix reset', value: '> Resets the bots prefix.'})
                    .addFields({ name: '• /prefix check', value: '> Checks the bots prefix.'})

                    .setImage('https://i.postimg.cc/8CbGp6D5/Screenshot-300.png')
                    .setTimestamp(); 

                const commandbuttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('helpcenterbutton')
                            .setLabel('Help Center')
                            .setStyle(ButtonStyle.Success),

                            new ButtonBuilder()
                            .setCustomId('first')
                            .setLabel('◀◀')
                            .setDisabled(true)
                            .setStyle(ButtonStyle.Primary),

                        new ButtonBuilder()
                            .setCustomId('pageleft')
                            .setLabel('◀')
                            .setDisabled(true)
                            .setStyle(ButtonStyle.Secondary),

                        new ButtonBuilder()
                            .setCustomId('pageright')
                            .setLabel('▶')
                            .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                            .setCustomId('last')
                            .setLabel('▶▶')
                            .setStyle(ButtonStyle.Primary)
                    );

                const commandbuttons1 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('helpcenterbutton1')
                            .setLabel('Help Center')
                            .setStyle(ButtonStyle.Success),

                            new ButtonBuilder()
                            .setCustomId('first')
                            .setLabel('◀◀')
                            .setStyle(ButtonStyle.Primary),

                        new ButtonBuilder()
                            .setCustomId('pageleft1')
                            .setLabel('◀')
                            .setDisabled(false)
                            .setStyle(ButtonStyle.Secondary),

                        new ButtonBuilder()
                            .setCustomId('pageright1')
                            .setDisabled(false)
                            .setLabel('▶')
                            .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                            .setCustomId('last')
                            .setLabel('▶▶')
                            .setStyle(ButtonStyle.Primary)
                        );

                    const commandbuttons2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('helpcenterbutton2')
                            .setLabel('Help Center')
                            .setStyle(ButtonStyle.Success),

                            new ButtonBuilder()
                            .setCustomId('first')
                            .setLabel('◀◀')
                            .setStyle(ButtonStyle.Primary),

                        new ButtonBuilder()
                            .setCustomId('pageleft2')
                            .setLabel('◀')
                            .setDisabled(false)
                            .setStyle(ButtonStyle.Secondary),

                        new ButtonBuilder()
                            .setCustomId('pageright2')
                            .setDisabled(false)
                            .setLabel('▶')
                            .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                            .setCustomId('last')
                            .setLabel('▶▶')
                            .setStyle(ButtonStyle.Primary)
                    );

                const commandbuttons3 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('helpcenterbutton3')
                            .setLabel('Help Center')
                            .setStyle(ButtonStyle.Success),

                            new ButtonBuilder()
                            .setCustomId('first')
                            .setLabel('◀◀')
                            .setStyle(ButtonStyle.Primary),

                        new ButtonBuilder()
                            .setCustomId('pageleft3')
                            .setLabel('◀')
                            .setDisabled(false)
                            .setStyle(ButtonStyle.Secondary),

                        new ButtonBuilder()
                            .setCustomId('pageright3')
                            .setDisabled(false)
                            .setLabel('▶')
                            .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                            .setCustomId('last')
                            .setLabel('▶▶')
                            .setStyle(ButtonStyle.Primary)
                    );

                const commandbuttons4 = new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()
                            .setCustomId('helpcenterbutton4')
                            .setLabel('Help Center')   
                            .setStyle(ButtonStyle.Success),

                            new ButtonBuilder()
                            .setCustomId('first')
                            .setLabel('◀◀')
                            .setStyle(ButtonStyle.Primary),

                        new ButtonBuilder()
                            .setCustomId('pageleft4')
                            .setLabel('◀')
                            .setDisabled(false)
                            .setStyle(ButtonStyle.Secondary),

                        new ButtonBuilder()
                            .setCustomId('pageright4')
                            .setDisabled(false)
                            .setLabel('▶')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('last')
                            .setLabel('▶▶')
                            .setDisabled(true)
                            .setStyle(ButtonStyle.Primary)
                            
                    );
                
                    const commandbuttons5 = new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()
                            .setCustomId('helpcenterbutton5')
                            .setLabel('Help Center')   
                            .setStyle(ButtonStyle.Success),

                            new ButtonBuilder()
                            .setCustomId('first')
                            .setLabel('◀◀')
                            .setStyle(ButtonStyle.Primary),

                        new ButtonBuilder()
                            .setCustomId('pageleft5')
                            .setLabel('◀')
                            .setDisabled(false)
                            .setStyle(ButtonStyle.Secondary),

                        new ButtonBuilder()
                            .setCustomId('pageright5')
                            .setDisabled(false)
                            .setLabel('▶')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('last')
                            .setLabel('▶▶')
                            .setDisabled(false)
                            .setStyle(ButtonStyle.Primary)
                            
                    );

                    const commandbuttons6 = new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()
                            .setCustomId('helpcenterbutton6')
                            .setLabel('Help Center')   
                            .setStyle(ButtonStyle.Success),

                            new ButtonBuilder()
                            .setCustomId('first')
                            .setLabel('◀◀')
                            .setStyle(ButtonStyle.Primary),

                        new ButtonBuilder()
                            .setCustomId('pageleft6')
                            .setLabel('◀')
                            .setDisabled(false)
                            .setStyle(ButtonStyle.Secondary),

                        new ButtonBuilder()
                            .setCustomId('pageright6')
                            .setDisabled(true)
                            .setLabel('▶')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('last')
                            .setLabel('▶▶')
                            .setDisabled(true)
                            .setStyle(ButtonStyle.Primary)
                            
                    );


                await interaction.update({ embeds: [commandpage1], components: [commandbuttons] }).catch(err);
                const collector = interaction.message.createMessageComponentCollector({ componentType: ComponentType.Button });

                collector.on('collect', async (i, err) => {

                    if (i.customId === 'last') {
                        i.update({ embeds: [commandpage7], components: [commandbuttons6] }).catch(err);
                    } 

                    if (i.customId === 'first') {
                        i.update({ embeds: [commandpage1], components: [commandbuttons] }).catch(err);
                    }

                    if (i.customId === 'helpcenterbutton') {
                        i.update({ embeds: [centerembed], components: [helprow2] }).catch(err);
                    }

                    if (i.customId === 'pageleft') { 
                        i.update({ embeds: [commandpage1], components: [commandbuttons] }).catch(err);
                    }

                    if (i.customId === 'pageright') { 
                        i.update({ embeds: [commandpage2], components: [commandbuttons1] }).catch(err);
                    }

                    if (i.customId === 'helpcenterbutton1') {
                        i.update({ embeds: [centerembed], components: [helprow2] }).catch(err);
                    }

                    if (i.customId === 'pageright1') {
                        i.update({ embeds: [commandpage3], components: [commandbuttons2] }).catch(err);
                    }

                    if (i.customId === 'pageleft1') {
                        i.update({ embeds: [commandpage1], components: [commandbuttons] }).catch(err);
                    }

                    if (i.customId === 'helpcenterbutton2') {
                        i.update({ embeds: [centerembed], components: [helprow2] }).catch(err);
                    }

                    if (i.customId === 'pageright2') {
                        i.update({ embeds: [commandpage4], components: [commandbuttons3] }).catch(err);
                    }

                    if (i.customId === 'pageleft2') {
                        i.update({ embeds: [commandpage2], components: [commandbuttons1] }).catch(err);
                    }

                    if (i.customId === 'helpcenterbutton3') {
                        i.update({ embeds: [centerembed], components: [helprow2] }).catch(err)
                    }

                    if (i.customId === 'pageright3') {
                        i.update({ embeds: [commandpage5], components: [commandbuttons4] }).catch(err);
                    }

                    if (i.customId === 'pageleft3') {
                        i.update({ embeds: [commandpage3], components: [commandbuttons2] }).catch(err);
                    }

                    if (i.customId === 'helpcenterbutton4') {
                        i.update({ embeds: [centerembed], components: [helprow2] }).catch(err);
                    }

                    if (i.customId === 'pageright4') {
                        i.update({ embeds: [commandpage6], components: [commandbuttons5] }).catch(err);
                    } 

                    if (i.customId === 'pageleft4') {
                        i.update({ embeds: [commandpage4], components: [commandbuttons3] }).catch(err);
                    }

                    if (i.customId === 'helpcenterbutton5') {
                        i.update({ embeds: [centerembed], components: [helprow2] }).catch(err);
                    }

                    if (i.customId === 'pageright5') {
                        i.update({ embeds: [commandpage7], components: [commandbuttons6] }).catch(err);
                    } 

                    if (i.customId === 'pageleft5') {
                        i.update({ embeds: [commandpage5], components: [commandbuttons4] }).catch(err);
                    }

                    if (i.customId === 'helpcenterbutton6') {
                        i.update({ embeds: [centerembed], components: [helprow2] }).catch(err);
                    }

                    if (i.customId === 'pageright6') {
                        i.update({ embeds: [commandpage7], components: [commandbuttons6] }).catch(err);
                    } 

                    if (i.customId === 'pageleft6') {
                        i.update({ embeds: [commandpage6], components: [commandbuttons5] }).catch(err);
                    } 
                });
            }

            if (value === 'pcommands') {

                const fetchGuildPrefix = await guildSettingsSchema.findOne({ Guild: interaction.guild.id });
                const guildPrefix = fetchGuildPrefix.Prefix;

                const pcommandpage = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle(`${client.user.username} Help Center ${client.config.arrowEmoji}`)
                    .setAuthor({ name: `🚑 Help Command ${client.config.devBy}` })
                    .setFooter({ text: `🚑 ${client.user.username}'s help center: Prefix Commands Page 1` })
                    .setThumbnail(client.user.avatarURL())
                    .setDescription(`> **Prefix Commands Help Page \`\`1\`\`**`)
                    .addFields({ name: `• ${guildPrefix}animalfacts`, value: `> Gives you a random animal fact.` })
                    .addFields({ name: `• ${guildPrefix}meme`, value: `> Displays a random meme.` })
                    .addFields({ name: `• ${guildPrefix}beg`, value: `> Beg for money. Results may vary.` })
                    .addFields({ name: `• ${guildPrefix}daily`, value: `> Collect your daily reward.` })
                    .addFields({ name: `• ${guildPrefix}work`, value: `> Work for money.` })
                    .addFields({ name: `• ${guildPrefix}account`, value: `> View your economy account information.` })
                    .addFields({ name: `• ${guildPrefix}cprefix`, value: `> Changes the bots prefix.` })
                    .addFields({ name: `• ${guildPrefix}dad-joke`, value: `> Tells a dad joke.` })
                    .addFields({ name: `• ${guildPrefix}iq`, value: `> Displays your IQ.` })
                    .addFields({ name: `• ${guildPrefix}nitro`, value: `> Generates a nitro code. (fake)` })
                    .addFields({ name: `• ${guildPrefix}rc`, value: `> Displays a relationship checker.` })
                    .addFields({ name: `• ${guildPrefix}ban`, value: `> Bans a user` })
                    .addFields({ name: `• ${guildPrefix}kick`, value: `> Kicks a user` })
                    .addFields({ name: `• ${guildPrefix}unban`, value: `> Unbans a user` })
                    .addFields({ name: `• ${guildPrefix}pfp`, value: `> Displays a users profile picture` })
                    .addFields({ name: `• ${guildPrefix}bot-specs`, value: `> Shows the bots specifications.` })
                    .addFields({ name: `• ${guildPrefix}bot-info`, value: `> Shows the bots information.` })
                    .addFields({ name: `• ${guildPrefix}member-graph`, value: `> Displays the server member graph.` })
                    .addFields({ name: `• ${guildPrefix}perms`, value: `> Displays a users permissions.` })
                    .addFields({ name: `• ${guildPrefix}serverinfo`, value: `> Displays the server information.` })
                    .addFields({ name: `• ${guildPrefix}userinfo`, value: `> Displays a users information.` })
                    .addFields({ name: `• ${guildPrefix}roleinfo`, value: `> Displays a roles information.` })
                    .addFields({ name: `• ${guildPrefix}uptime`, value: `> Shows the bots uptime.` })
                    .addFields({ name: `• ${guildPrefix}lb`, value: `> Displays the server leaderboard.` })
                    .addFields({ name: `• ${guildPrefix}rank`, value: `> Displays a users rank.` })

                    .setImage('https://i.postimg.cc/TPTDJZt7/Screenshot-2024-06-22-211847.png')
                    .setTimestamp();

                const pcommandpage1 = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setTitle(`${client.user.username} Help Center ${client.config.arrowEmoji}`)
                    .setAuthor({ name: `🚑 Help Command ${client.config.devBy}` })
                    .setFooter({ text: `🚑 ${client.user.username}'s help center: Prefix Commands Page 2` })
                    .setThumbnail(client.user.avatarURL())
                    .setDescription(`> **Prefix Commands Help Page \`\`2\`\`**`)
                    .addFields({ name: `• ${guildPrefix}addrole`, value: `> Adds a role to a user.` })
                    .addFields({ name: `• ${guildPrefix}removerole`, value: `> Removes a role from a user.` })
                    .addFields({ name: `• ${guildPrefix}nick`, value: `> Changes a users nickname.` })
                    .addFields({ name: `• ${guildPrefix}clear`, value: `> Clears a specified amount of messages.` })
                    .addFields({ name: `• ${guildPrefix}autoplay`, value: `> Toggles autoplay for the music system.` })
                    .addFields({ name: `• ${guildPrefix}filter`, value: `> Toggles the music filter.` })
                    .addFields({ name: `• ${guildPrefix}forward`, value: `> Forwards the music.` })
                    .addFields({ name: `• ${guildPrefix}join`, value: `> Makes the bot join a voice channel.` })
                    .addFields({ name: `• ${guildPrefix}leave`, value: `> Makes the bot leave a voice channel.` })
                    .addFields({ name: `• ${guildPrefix}np`, value: `> Shows the currently playing song.` })
                    .addFields({ name: `• ${guildPrefix}pause`, value: `> Pauses the music.` })
                    .addFields({ name: `• ${guildPrefix}play`, value: `> Plays a song.` })
                    .addFields({ name: `• ${guildPrefix}playskip`, value: `> Plays a song and skips the current song.` })
                    .addFields({ name: `• ${guildPrefix}playtop`, value: `> Plays the top song in queue.` })
                    .addFields({ name: `• ${guildPrefix}previous`, value: `> Plays the previous song.` })
                    .addFields({ name: `• ${guildPrefix}queue`, value: `> Shows the music queue.` })
                    .addFields({ name: `• ${guildPrefix}repeat`, value: `> Toggles repeat for the music system.` })
                    .addFields({ name: `• ${guildPrefix}resume`, value: `> Resumes the music.` })
                    .addFields({ name: `• ${guildPrefix}rewind`, value: `> Rewinds the music.` })
                    .addFields({ name: `• ${guildPrefix}seek`, value: `> Seeks the music.` })
                    .addFields({ name: `• ${guildPrefix}shuffle`, value: `> Shuffles the music queue.` })
                    .addFields({ name: `• ${guildPrefix}skip`, value: `> Skips the current song.` })
                    .addFields({ name: `• ${guildPrefix}skipto`, value: `> Skips to a specified song.` })
                    .addFields({ name: `• ${guildPrefix}stop`, value: `> Stops the music.` })
                    .addFields({ name: `• ${guildPrefix}volume`, value: `> Changes the music volume.` })

                    .setImage('https://i.postimg.cc/TPTDJZt7/Screenshot-2024-06-22-211847.png')
                    .setTimestamp();

                const pcommandbuttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('pcommand-helpcenterbutton')
                            .setLabel('Help Center')
                            .setStyle(ButtonStyle.Success),

                            new ButtonBuilder()
                            .setCustomId('pcommand-first')
                            .setLabel('◀◀')
                            .setDisabled(true)
                            .setStyle(ButtonStyle.Primary),

                        new ButtonBuilder()
                            .setCustomId('pcommand-pageleft')
                            .setLabel('◀')
                            .setDisabled(true)
                            .setStyle(ButtonStyle.Secondary),

                        new ButtonBuilder()
                            .setCustomId('pcommand-pageright')
                            .setLabel('▶')
                            .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                            .setCustomId('pcommand-last')
                            .setLabel('▶▶')
                            .setStyle(ButtonStyle.Primary)
                    );

                const pcommandbuttons1 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('pcommand-helpcenterbutton1')
                            .setLabel('Help Center')
                            .setStyle(ButtonStyle.Success),

                            new ButtonBuilder()
                            .setCustomId('pcommand-first')
                            .setLabel('◀◀')
                            .setStyle(ButtonStyle.Primary),

                        new ButtonBuilder()
                            .setCustomId('pcommand-pageleft1')
                            .setLabel('◀')
                            .setDisabled(false)
                            .setStyle(ButtonStyle.Secondary),

                        new ButtonBuilder()
                            .setCustomId('pcommand-pageright1')
                            .setDisabled(false)
                            .setLabel('▶')
                            .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                            .setCustomId('pcommand-last')
                            .setLabel('▶▶')
                            .setStyle(ButtonStyle.Primary)
                        );
                    
                await interaction.update({ embeds: [pcommandpage], components: [pcommandbuttons] }).catch(err);
                const collector = interaction.message.createMessageComponentCollector({ componentType: ComponentType.Button });

                collector.on('collect', async (i, err) => {
                    try {

                        await i.deferUpdate();

                        if (i.customId === 'pcommand-last') {
                            i.editReply({ embeds: [pcommandpage1], components: [pcommandbuttons1] }).catch(err);
                        } 

                        if (i.customId === 'pcommand-first') {
                            i.editReply({ embeds: [pcommandpage], components: [pcommandbuttons] }).catch(err);
                        }

                        if (i.customId === 'pcommand-helpcenterbutton') {
                            i.editReply({ embeds: [centerembed], components: [helprow2] }).catch(err);
                        }

                        if (i.customId === 'pcommand-pageleft') { 
                            i.editReply({ embeds: [pcommandpage], components: [pcommandbuttons] }).catch(err);
                        }

                        if (i.customId === 'pcommand-pageright') { 
                            i.editReply({ embeds: [pcommandpage1], components: [pcommandbuttons1] }).catch(err);
                        }

                        if (i.customId === 'pcommand-helpcenterbutton1') {
                            i.editReply({ embeds: [centerembed], components: [helprow2] }).catch(err);
                        }

                        if (i.customId === 'pcommand-pageright1') {
                            i.editReply({ embeds: [pcommandpage1], components: [pcommandbuttons1] }).catch(err);
                        }

                        if (i.customId === 'pcommand-pageleft1') {
                            i.editReply({ embeds: [pcommandpage], components: [pcommandbuttons] }).catch(err);
                        }
                    } catch(err) {
                        console.log(`${color.red}[${getTimestamp()}]${color.reset} [PREFIX_HELP_MENU] There was an error in the buttons on prefix command help center`, err);
                    }
                });
            }
        })
    }
})
