const {
    WebhookClient,
    EmbedBuilder
} = require('discord.js');
// require('dotenv').config();
// const db = require('../database/discord.js');

// const webhookUrl = process.env.WEBHOOK_URL;
const TeamNames = ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT", "GOLF", "HOTEL", "INDIA", "JULIET", "KILO", "LIMA", "MIKE", "NOVEMBER", "OSCAR", "PAPA", "QUEBEC", "ROMEO", "SIERRA", "TANGO", "UNIFORM", "VICTOR", "WHISKEY", "XRAY", "YANKEE", "ZULU"];


const SendMatches = async (webhookUrls, match) => {
    // loop through all webhook urls and call SendMatch with the match
    console.log("sending matches")
    await Promise.all(webhookUrls.map(webhookUrl => SendMatch(webhookUrl, match)));
}

const SendMatch = async (webhookUrl, match) => {
    const wh = new WebhookClient({
        id: "BOT WATCHR",
        url: webhookUrl
    })

    var headerEmbed = new EmbedBuilder()
        // .setAuthor({
        //     name: "PUBG TRACKER",
        // })
        .setTitle(`Season ${match.seasonId} | ${match.mapName} | ${match.gameMode}`)
        .addFields(
            {
                name: "__Lobby__",
                value: `Bots: \`${match.aiParticipantsCount}\`\nHuman: \`${match.humanParticipantsCount}\``,
                inline: true
            },
            {
                name: "__Tracking__",
                value: `\`${match.matchingPlayerCount}\` ${match.matchingPlayerCount > 1 ? 'players' : 'player'} in \`${match.teams.length}\` ${match.length > 1 ? 'teams' : 'team'}`,
                inline: true
            },
        )
        .setColor("#ffffff")
        .setFooter({
            text: "PUBG TRACKER"
        })
        .setTimestamp();

    match.teams.forEach((team, i) => {
        headerEmbed.addFields(
            {
                name: "\u200b",
                value: "────────────────────────────────────────────\n",
                inline: false
            },
            {
                name: `**${ordinalSuffix(team.winPlace)}    >>    Team ${TeamNames[i]}**`,
                value: `\u200b`,
                inline: false
            },
        )

        team.players.sort((a, b) => a.name.localeCompare(b.name)).forEach((player, i) => {
            headerEmbed.addFields({
                name: `__${player.name}__`,
                value: `Kills: \`${player.kills}\`\nDamage: \`${player.damageDealt.toFixed(0)}\`\nDBNOs: \`${player.DBNOs}\`\nRevives: \`${player.revives}\``,
                inline: true
            })
            // after 2nd inline field we will add a blank field
            if (i == 1) {
                headerEmbed.addFields({
                    name: "\u200b",
                    value: "\u200b",
                    inline: false
                })
            }
        })
    })

    wh.send({
        embeds: [headerEmbed],
    });

}

const ordinalSuffix = (i) => {
    const j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

const SendLeaderboard = async () => {
    // implement
}

module.exports = {
    SendMatches,
    SendMatch,
    SendLeaderboard
}