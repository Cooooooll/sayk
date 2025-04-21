const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, AttachmentBuilder } = require('discord.js');
const fetch = require('node-fetch');
const { createCanvas, loadImage } = require('canvas');
const { 
    formatPerkName, 
    getDBDPerkWithBackground 
} = require('../../images');

function normalizeSpecialChars(str) {
    if (!str) return '';
    
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[&]/g, 'And')
        .replace(/[œ]/g, 'oe')
        .replace(/[æ]/g, 'ae')
        .replace(/[ø]/g, 'o');
}

function formatPerkNameForAPI(perkName) {
    if (!perkName) return '';
    
    const normalizedName = normalizeSpecialChars(perkName);
    
    const lowerName = normalizedName.toLowerCase();
    if (specialCases[lowerName]) {
        return specialCases[lowerName];
    }

    return normalizedName
        .toLowerCase()
        .split(/\s+/)
        .map((word, index) => {
            return index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join('');
}

module.exports = {
    usableInDms: true,
    category: 'Community',
    data: new SlashCommandBuilder()
        .setName('dbd')
        .setDescription('Dead by Daylight game information commands')
        .addSubcommand(subcommand => 
            subcommand
                .setName('perkinfo')
                .setDescription('Get information about a specific Dead by Daylight perk')
                .addStringOption(option => 
                    option.setName('perk')
                        .setDescription('Name of the perk (e.g. Adrenaline, DeadHard, BBQAndChili)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('playerstats')
                .setDescription('Get player statistics for a Dead by Daylight player')
                .addStringOption(option => 
                    option.setName('steamid')
                        .setDescription('Steam ID of the player (e.g. 76561199012448515)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('randomperks')
                .setDescription('Get random Dead by Daylight perks')
                .addStringOption(option => 
                    option.setName('role')
                        .setDescription('Choose the role (survivor or killer)')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Survivor', value: 'survivor' },
                            { name: 'Killer', value: 'killer' }
                        )
                )
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('shrine')
                .setDescription('Get the current Dead by Daylight shrine of secrets')
        ),
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        await interaction.deferReply();
        
        try {
            switch (subcommand) {
                case 'perkinfo':
                    await handlePerkInfo(interaction, client);
                    break;
                case 'playerstats':
                    await handlePlayerStats(interaction, client);
                    break;
                case 'randomperks':
                    await handleRandomPerks(interaction, client);
                    break;
                case 'shrine':
                    await handleShrine(interaction, client);
                    break;
            }
        } catch (error) {
            console.error(`Error in DBD command: ${error}`);
            await interaction.editReply({ 
                content: 'An error occurred while fetching Dead by Daylight information. Please try again later.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};

async function handlePerkInfo(interaction, client) {
    const rawPerkName = interaction.options.getString('perk');
    const perkName = formatPerkNameForAPI(rawPerkName);
    
    try {
        const response = await fetch(`https://dbd.tricky.lol/api/perkinfo?perk=${encodeURIComponent(perkName)}`);
        const data = await response.json();
        
        if (!data || data.error) {
            return interaction.editReply({ 
                content: `Could not find information for perk: "${rawPerkName}". Please check the spelling and try again.`,
                flags: MessageFlags.Ephemeral
            });
        }
        
        let processedDescription = data.description.replace(/<br>/g, '\n').replace(/<\/?[^>]+(>|$)/g, '');
        
        data.tunables.forEach((tunable, index) => {
            const value = Array.isArray(tunable[0]) ? tunable[0][0] : tunable[0];
            processedDescription = processedDescription.replace(new RegExp(`\\{${index}\\}`, 'g'), value);
        });
        
        const roleEmoji = data.role === 'survivor' ? '👱' : '🔪';
        const roleColor = data.role === 'survivor' ? '#3498DB' : '#E74C3C';
        
        const categoryEmojis = {
            'navigation': '🧭',
            'adaptation': '🔄',
            'support': '🤝',
            'perception': '👁️',
            'stealth': '🙊',
            'obstruction': '🚫',
            'concealment': '🌫️',
            'tracking': '👣',
            'mobility': '🏃',
            'trickery': '🎭',
            'strategy': '🧠',
            'enhancement': '💪',
            'debuff': '⬇️',
            'buff': '⬆️',
            'interrogation': '❓',
            'power': '⚡',
            'control': '🎮'
        };
        
        const categoriesWithEmojis = data.categories.map(cat => {
            const emoji = categoryEmojis[cat.toLowerCase()] || '📌';
            return `${emoji} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
        }).join(' • ');
        
        const tunableTiersText = data.tunables.map((tunable, index) => {
            if (tunable.length === 1) {
                return `• Tier {${index}}: **${tunable[0]}**`;
            } else {
                return `• Tier {${index}}: **${tunable.join(' / ')}**`;
            }
        }).join('\n');

        const formattedPerkName = formatPerkName(data.name);
        const perkImage = await getDBDPerkWithBackground(formattedPerkName);
        
        const embed = new EmbedBuilder()
            .setColor(roleColor)
            .setTitle(`${roleEmoji} ${data.name}`)
            .setDescription(`*${processedDescription}*`)
            .addFields(
                { name: '📋 __Categories__', value: categoriesWithEmojis || '*None*', inline: false },
                { name: '⚖️ __Role__', value: `${roleEmoji} **${data.role.charAt(0).toUpperCase() + data.role.slice(1)}**`, inline: true },
                { name: '🏆 __Teachable Level__', value: data.teachable ? `**Level ${data.teachable}**` : '**Common Perk**', inline: true }
            )
            .setFooter({ text: '💀 Data provided by dbd.tricky.lol API' })
            .setTimestamp();

        if (tunableTiersText) {
            embed.addFields({ name: '📊 __Perk Values__', value: tunableTiersText, inline: false });
        }
        
        if (data.character) {
            const characterNames = {
                1: 'Meg Thomas',
                2: 'Claudette Morel',
                3: 'Jake Park',
                4: 'Nea Karlsson',
                5: 'Laurie Strode',
                6: 'Ace Visconti',
                7: 'Bill Overbeck',
                8: 'Feng Min',
                9: 'David King',
                10: 'Kate Denson',
                11: 'Quentin Smith',
                12: 'Tapp',
                13: 'Adam Francis',
            };
            
            const characterName = characterNames[data.character] || `Character ID: ${data.character}`;
            embed.addFields({ name: '👤 __Character__', value: `**${characterName}**`, inline: true });
        }
        
        if (perkImage) {
            embed.setThumbnail(`attachment://${perkImage.name}`);
            await interaction.editReply({ 
                embeds: [embed],
                files: [perkImage]
            });
        } else {
            await interaction.editReply({ embeds: [embed] });
        }
    } catch (error) {
        console.error(`Error fetching perk info: ${error}`);
        await interaction.editReply({ 
            content: 'An error occurred while fetching perk information. Please try again later.',
            flags: MessageFlags.Ephemeral
        });
    }
}

async function handlePlayerStats(interaction, client) {
    const steamId = interaction.options.getString('steamid');
    
    try {
        const response = await fetch(`https://dbd.tricky.lol/api/playerstats?steamid=${encodeURIComponent(steamId)}`);
        const data = await response.json();
        
        if (!data || data.error) {
            return interaction.editReply({ 
                content: `Could not find player stats for SteamID: "${steamId}". Please check the ID and try again.`,
                flags: MessageFlags.Ephemeral
            });
        }
        
        const playtimeHours = Math.floor(data.playtime / 3600);
        const playtimeMinutes = Math.floor((data.playtime % 3600) / 60);
        
        const updatedDate = new Date(data.updated_at * 1000).toLocaleDateString();
        const updatedTime = new Date(data.updated_at * 1000).toLocaleTimeString();
        
        const survivorEmbed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle(`👱 Survivor Stats for Steam ID: ${steamId}`)
            .setDescription(`*Last Updated: ${updatedDate} at ${updatedTime}*`)
            .addFields(
                { name: '📊 __General Statistics__', value: 
                    `> 🏆 **Rank:** ${data.survivor_rank}\n` +
                    `> 💰 **Bloodpoints:** ${data.bloodpoints.toLocaleString()}\n` +
                    `> 🎮 **Perfect Games:** ${data.survivor_perfectgames}\n` +
                    `> 💎 **Ultra Rare Items Used:** ${data.survivor_ultrarare}`, 
                    inline: false 
                },
                { name: '🔧 __Objectives__', value: 
                    `> 🔌 **Generators Repaired:** ${data.gensrepaired}\n` +
                    `> 🛠️ **Damaged Gens Repaired:** ${data.damagedgensrepaired}\n` +
                    `> 🚪 **Exit Gates Opened:** ${data.exitgatesopened}\n` +
                    `> 📦 **Chests Searched:** ${data.chestssearched}`, 
                    inline: true 
                },
                { name: '❤️ __Altruism__', value: 
                    `> 🩹 **Survivors Healed:** ${data.survivorshealed}\n` +
                    `> 🪝 **Saves from Hook:** ${data.saved}\n` +
                    `> 🛡️ **Protection Hits:** ${(data.protectionhits_unhooked || 0) + (data.protectionhits_whilecarried || 0)}\n` +
                    `> ⏰ **Endgame Saves:** ${data.saved_endgame}`, 
                    inline: true 
                },
                { name: '🏃 __Escapes & Chases__', value: 
                    `> 🏁 **Total Escapes:** ${data.escaped}\n` +
                    `> 🕳️ **Hatch Escapes:** ${data.escaped_hatch}\n` +
                    `> 🪟 **Vaults in Chase:** ${data.vaultsinchase}\n` +
                    `> 😵 **Killers Stunned:** ${(data.killerstunned_palletcarrying || 0) + (data.killerstunned_holdingitem || 0)}`, 
                    inline: true 
                },
                { name: '🔦 __Special Actions__', value: 
                    `> 💡 **Killers Blinded:** ${data.killerblinded_flashlight || 0}\n` +
                    `> 🪝 **Self Unhooks:** ${data.unhookedself || 0}\n` +
                    `> 🔥 **Hex Totems Cleansed:** ${data.hextotemscleansed || 0}\n` +
                    `> 💪 **Wiggled Free:** ${data.wiggledfromkillersgrasp || 0}`, 
                    inline: true 
                }
            )
            .setFooter({ text: `💀 Playtime: ${playtimeHours} hours ${playtimeMinutes} minutes • Data by dbd.tricky.lol` })
            .setThumbnail('https://cdn.nightlight.gg/img/portraits/iconPortraits_default.png')
            .setTimestamp();
            
        const killerEmbed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle(`🔪 Killer Stats for Steam ID: ${steamId}`)
            .setDescription(`*Last Updated: ${updatedDate} at ${updatedTime}*`)
            .addFields(
                { name: '📊 __General Statistics__', value: 
                    `> 🏆 **Rank:** ${data.killer_rank}\n` +
                    `> 🎮 **Perfect Games:** ${data.killer_perfectgames}\n` +
                    `> 💎 **Ultra Rare Add-ons Used:** ${data.killer_ultrarare}`, 
                    inline: false 
                },
                { name: '💀 __Kills & Sacrifices__', value: 
                    `> 🔪 **Kills:** ${data.killed || 0}\n` +
                    `> 🪝 **Sacrifices:** ${data.sacrificed || 0}\n` +
                    `> 🎯 **Obsessions Sacrificed:** ${data.sacrificed_obsessions || 0}\n` +
                    `> ⏰ **Endgame Kills/Sacrifices:** ${data.killed_sacrificed_afterlastgen || 0}`, 
                    inline: true 
                },
                { name: '🪝 __Hooks & Grabs__', value: 
                    `> 🏠 **Basement Hooks:** ${data.survivorshookedinbasement || 0}\n` +
                    `> ⏰ **Endgame Hooks:** ${data.survivorshookedendgamecollapse || 0}\n` +
                    `> 📦 **Locker Grabs:** ${data.survivorsgrabbedfrominsidealocker || 0}\n` +
                    `> 🔌 **Generator Grabs:** ${data.survivorsgrabbedrepairinggen || 0}`, 
                    inline: true 
                },
                { name: '🎯 __Special Attacks__', value: 
                    `> ⚡ **Blink Attacks:** ${data.blinkattacks || 0}\n` +
                    `> 🪚 **Chainsaw Hits:** ${data.chainsawhits || 0}\n` +
                    `> 🪓 **Hatchets Thrown:** ${data.hatchetsthrown || 0}\n` +
                    `> 🌚 **Undetectable Hits:** ${data.survivorshit_basicattackundetectable || 0}`, 
                    inline: true 
                },
                { name: '🧠 __Advanced Tactics__', value: 
                    `> 🔩 **Damaged Gens (One Hooked):** ${data.gensdamagedwhileonehooked || 0}\n` +
                    `> 🕸️ **Trap Catches:** ${data.beartrapcatches || 0}\n` +
                    `> 🪝 **3 Survivors Hooked at Once:** ${data.survivorsthreehookedbasementsametime || 0}\n` +
                    `> 🌙 **Exposed Status Effect Downs:** ${data.survivorsdowned_exposed || 0}`, 
                    inline: true 
                }
            )
            .setFooter({ text: `💀 Playtime: ${playtimeHours} hours ${playtimeMinutes} minutes • Data by dbd.tricky.lol` })
            .setThumbnail('https://cdn.nightlight.gg/img/portraits/iconPortraits_TR.png')
            .setTimestamp();
        
        await interaction.editReply({ embeds: [survivorEmbed, killerEmbed] });
    } catch (error) {
        console.error(`Error fetching player stats: ${error}`);
        await interaction.editReply({ 
            content: 'An error occurred while fetching player stats. Please try again later.',
            flags: MessageFlags.Ephemeral
        });
    }
}

async function handleRandomPerks(interaction, client) {
    const role = interaction.options.getString('role');
    
    try {
        await fetchAndDisplayRandomPerks(interaction, role, client);
    } catch (error) {
        console.error(`Error fetching random perks: ${error}`);
        await interaction.editReply({ 
            content: 'An error occurred while fetching random perks. Please try again later.',
            flags: MessageFlags.Ephemeral
        });
    }
}

async function fetchAndDisplayRandomPerks(interaction, role, client) {
    try {
        const response = await fetch(`https://dbd.tricky.lol/api/randomperks?role=${encodeURIComponent(role)}`);
        const data = await response.json();
        
        if (!data || Object.keys(data).length === 0) {
            return interaction.editReply({ 
                content: `Could not fetch random ${role} perks. Please try again later.`,
                flags: MessageFlags.Ephemeral
            });
        }
        
        const roleEmoji = role === 'survivor' ? '👱' : '🔪';
        const roleColor = role === 'survivor' ? '#3498DB' : '#E74C3C';
        
        const canvas = createCanvas(800, 800);
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = roleColor === '#3498DB' ? '#1a365d' : '#5c1f1f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`Random ${role.charAt(0).toUpperCase() + role.slice(1)} Perk Build`, 400, 60);
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(400, 100);
        ctx.lineTo(400, 700);
        ctx.moveTo(100, 400);
        ctx.lineTo(700, 400);
        ctx.stroke();
        
        const positions = [
            { x: 200, y: 250 },
            { x: 600, y: 250 },
            { x: 200, y: 550 },
            { x: 600, y: 550 }
        ];
        
        const perks = Object.values(data).slice(0, 4);
        const perkInfos = [];
        
        for (let i = 0; i < perks.length; i++) {
            const perk = perks[i];
            
            let processedDescription = perk.description
                .replace(/<br>/g, '\n')
                .replace(/<\/?[^>]+(>|$)/g, '');
            
            if (perk.tunables && Array.isArray(perk.tunables)) {
                perk.tunables.forEach((tunable, idx) => {
                    if (Array.isArray(tunable) && tunable.length > 0) {
                        const value = tunable[0];
                        processedDescription = processedDescription.replace(
                            new RegExp(`\\{${idx}\\}`, 'g'), 
                            value
                        );
                    }
                });
            }
            
            const categoryEmoji = perk.categories && Array.isArray(perk.categories) && perk.categories.length > 0 ? 
                (perk.categories[0] === 'navigation' ? '🧭' : 
                perk.categories[0] === 'adaptation' ? '🔄' : 
                perk.categories[0] === 'support' ? '🤝' : 
                perk.categories[0] === 'perception' ? '👁️' : '📌') : '📌';
            
            perkInfos.push({
                name: perk.name,
                description: processedDescription.length > 200 ? 
                    processedDescription.substring(0, 197) + '...' : 
                    processedDescription,
                category: categoryEmoji,
                formattedName: formatPerkName(perk.name)
            });
            
            try {
                const formattedPerkName = formatPerkName(perk.name);
                const perkWithBg = await getDBDPerkWithBackground(formattedPerkName);
                
                if (perkWithBg) {
                    const perkImage = await loadImage(perkWithBg.attachment);
                    
                    const perkSize = 200;
                    ctx.drawImage(
                        perkImage, 
                        positions[i].x - perkSize/2, 
                        positions[i].y - perkSize/2, 
                        perkSize, 
                        perkSize
                    );
                    
                    ctx.font = 'bold 20px Arial';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = 'center';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                    ctx.shadowBlur = 4;
                    ctx.fillText(perk.name, positions[i].x, positions[i].y + 120);
                    ctx.shadowBlur = 0;
                } else {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.fillRect(positions[i].x - 75, positions[i].y - 75, 150, 150);
                    ctx.font = 'bold 20px Arial';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = 'center';
                    ctx.fillText(perk.name, positions[i].x, positions[i].y);
                }
            } catch (imgError) {
                console.error(`Error drawing perk ${perk.name}:`, imgError);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(positions[i].x - 75, positions[i].y - 75, 150, 150);
                ctx.font = 'bold 20px Arial';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.fillText(perk.name, positions[i].x, positions[i].y);
            }
        }
        
        const buffer = canvas.toBuffer('image/png');
        const collageAttachment = new AttachmentBuilder(buffer);
        collageAttachment.setName('random_perks_collage.png');
        
        const embed = new EmbedBuilder()
            .setColor(roleColor)
            .setTitle(`${roleEmoji} Random ${role.charAt(0).toUpperCase() + role.slice(1)} Perks`)
            .setDescription(`*Here's a random selection of four perks for your ${role} loadout:*`)
            .setImage('attachment://random_perks_collage.png')
            .setFooter({ text: '💀 Click the reroll button below to generate new perks • Data by dbd.tricky.lol' })
            .setTimestamp();
        
        perkInfos.forEach((perk, index) => {
            embed.addFields({
                name: `${index + 1}. ${perk.category} __${perk.name}__`,
                value: `*${perk.description}*`,
                inline: false
            });
        });
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`dbd_reroll_${role}`)
                    .setLabel('🎲 Reroll Perks')
                    .setStyle(ButtonStyle.Primary)
            );
        
        await interaction.editReply({
            embeds: [embed],
            components: [row],
            files: [collageAttachment]
        });
        
    } catch (error) {
        console.error(`Error in random perks command: ${error}`);
        
        const embed = new EmbedBuilder()
            .setColor(role === 'survivor' ? '#3498DB' : '#E74C3C')
            .setTitle(`${role === 'survivor' ? '👱' : '🔪'} Random ${role.charAt(0).toUpperCase() + role.slice(1)} Perks`)
            .setDescription(`*Here's a random selection of perks for your ${role} loadout:*`)
            .setFooter({ text: '💀 Click the reroll button below to generate new perks • Data by dbd.tricky.lol' })
            .setTimestamp();
        
        Object.values(data).slice(0, 4).forEach((perk, index) => {
            let desc = perk.description.replace(/<br>/g, '\n').replace(/<\/?[^>]+(>|$)/g, '');
            
            if (perk.tunables && Array.isArray(perk.tunables)) {
                perk.tunables.forEach((tunable, i) => {
                    if (Array.isArray(tunable) && tunable.length > 0) {
                        desc = desc.replace(new RegExp(`\\{${i}\\}`, 'g'), tunable[0]);
                    }
                });
            }
            
            if (desc.length > 200) desc = desc.substring(0, 197) + '...';
            
            embed.addFields({
                name: `${index + 1}. __${perk.name}__`,
                value: `*${desc}*`,
                inline: false
            });
        });
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`dbd_reroll_${role}`)
                    .setLabel('🎲 Reroll Perks')
                    .setStyle(ButtonStyle.Primary)
            );
        
        await interaction.editReply({
            embeds: [embed],
            components: [row]
        });
    }
}

async function handleShrine(interaction, client) {
    try {
        const response = await fetch('https://dbd.tricky.lol/api/shrine');
        const data = await response.json();
        
        if (!data || data.error) {
            return interaction.editReply({ 
                content: 'Could not fetch shrine information. Please try again later.',
                flags: MessageFlags.Ephemeral
            });
        }
        
        const startDate = new Date(data.start * 1000).toLocaleDateString();
        const endDate = new Date(data.end * 1000).toLocaleDateString();
        const endTime = new Date(data.end * 1000);
        
        const currentTime = new Date();
        const timeRemaining = endTime - currentTime;
        
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        let timeRemainingText = '';
        if (days > 0) timeRemainingText += `${days} days, `;
        if (hours > 0 || days > 0) timeRemainingText += `${hours} hours, `;
        timeRemainingText += `${minutes} minutes`;
        
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle('🛒 Shrine of Secrets')
            .setDescription(`**Current shrine rotation from ${startDate} to ${endDate}**\n*Resets in ${timeRemainingText}*`)
            .setFooter({ text: '💀 Data provided by dbd.tricky.lol API' })
            .setTimestamp();
        
        const shrineAttachments = [];
        
        for (const perk of data.perks) {
            const formattedName = perk.id
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
                
            const isProbablySurvivor = !perk.id.startsWith('K') && !perk.id.startsWith('BBQ');
            const roleEmoji = isProbablySurvivor ? '👱' : '🔪';
            
            const formattedPerkName = formatPerkName(formattedName);
            const perkImage = await getDBDPerkWithBackground(formattedPerkName);
            
            if (perkImage) {
                shrineAttachments.push(perkImage);
            }
            
            embed.addFields({ 
                name: `${roleEmoji} __${formattedName}__`,
                value: `> 💎 **Iridescent Shards:** ${perk.shards.toLocaleString()}\n` +
                       `> 🩸 **Bloodpoints:** ${perk.bloodpoints.toLocaleString()}\n` +
                       (perkImage ? `> 🖼️ [View Perk Image](attachment://${perkImage.name})` : ''),
                inline: true
            });
        }
        
        await interaction.editReply({ 
            embeds: [embed],
            files: shrineAttachments
        });
    } catch (error) {
        console.error(`Error fetching shrine info: ${error}`);
        await interaction.editReply({ 
            content: 'An error occurred while fetching shrine information. Please try again later.',
            flags: MessageFlags.Ephemeral
        });
    }
}
