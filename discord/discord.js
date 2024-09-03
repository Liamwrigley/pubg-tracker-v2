const {
  WebhookClient,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
require("dotenv").config();

const LOGGING_WEBHOOK_URL = process.env.LOGGING_WEBHOOK_URL;

const createWebhookClient = (URL, id = "BOT WATCHR") => {
  return new WebhookClient({
    id: id,
    url: URL,
  });
};

const buildEmbed = (color = 0x00ff22, title = null) => {
  return new EmbedBuilder().setColor(color).setTitle(title);
};

const SendMatchImage = async (webhookUrl, images) => {
  const wh = createWebhookClient(webhookUrl);

  await wh.send({
    files: [new AttachmentBuilder(images.finalImage, { name: "match.png" })],
  });
};

const SendMatches = async (webhookUrls, match, images = {}) => {
  // loop through all webhook urls and call SendMatch with the match
  if (images && Object.keys(images).length > 0) {
    console.log("sending matches as images");
    await Promise.all(
      webhookUrls.map((webhookUrl) => SendMatchImage(webhookUrl, images))
    );
  } else {
    console.log("sending matches as embeds");
    await Promise.all(
      webhookUrls.map((webhookUrl) => SendMatch(webhookUrl, match))
    );
  }
};

const SendErrorReport = async (message, err) => {
  const wh = createWebhookClient(LOGGING_WEBHOOK_URL);
  var embed = buildEmbed(0xff0000);
  embed.setColor();
  embed.addFields(
    { name: "Location Info", value: message },
    { name: "Error", value: JSON.stringify(err).substring(0, 1000) }
  );
  await wh.send({ embeds: [embed] });
};

const SendInfoReport = async (message) => {
  const wh = createWebhookClient(LOGGING_WEBHOOK_URL);
  var embed = buildEmbed(0x00ffff);
  embed.addFields({ name: "Info", value: message });
  await wh.send({ embeds: [embed] });
};

// const SendMatch = async (webhookUrl, match) => {
//     const wh = new WebhookClient({
//         id: "BOT WATCHR",
//         url: webhookUrl
//     })

//     var headerEmbed = new EmbedBuilder()
//         // .setAuthor({
//         //     name: "PUBG TRACKER",
//         // })
//         .setTitle(`Season ${match.seasonId} | ${match.mapName} | ${match.gameMode}`)
//         .addFields(
//             {
//                 name: "__Lobby__",
//                 value: `Bots: \`${match.aiParticipantsCount}\`\nHuman: \`${match.humanParticipantsCount}\``,
//                 inline: true
//             },
//             {
//                 name: "__Tracking__",
//                 value: `\`${match.matchingPlayerCount}\` ${match.matchingPlayerCount > 1 ? 'players' : 'player'} in \`${match.teams.length}\` ${match.length > 1 ? 'teams' : 'team'}`,
//                 inline: true
//             },
//         )
//         .setColor("#ffffff")
//         .setFooter({
//             text: "PUBG TRACKER"
//         })
//         .setTimestamp();

//     match.teams.forEach((team, i) => {
//         headerEmbed.addFields(
//             {
//                 name: "\u200b",
//                 value: "────────────────────────────────────────────\n",
//                 inline: false
//             },
//             {
//                 name: `**${ordinalSuffix(team.winPlace)}    >>    Team ${team.teamName}**`,
//                 value: `\u200b`,
//                 inline: false
//             },
//         )

//         team.players.sort((a, b) => a.name.localeCompare(b.name)).forEach((player, i) => {
//             headerEmbed.addFields({
//                 name: `__${player.name}__`,
//                 value: `Kills: \`${player.kills}\`\nDamage: \`${player.damageDealt.toFixed(0)}\`\nDBNOs: \`${player.DBNOs}\`\nRevives: \`${player.revives}\``,
//                 inline: true
//             })
//             // after 2nd inline field we will add a blank field
//             if (i == 1) {
//                 headerEmbed.addFields({
//                     name: "\u200b",
//                     value: "\u200b",
//                     inline: false
//                 })
//             }
//         })
//     })

//     await wh.send({
//         embeds: [headerEmbed],
//     });

// }

// const ordinalSuffix = (i) => {
//     const j = i % 10,
//         k = i % 100;
//     if (j == 1 && k != 11) {
//         return i + "st";
//     }
//     if (j == 2 && k != 12) {
//         return i + "nd";
//     }
//     if (j == 3 && k != 13) {
//         return i + "rd";
//     }
//     return i + "th";
// }

const SendLeaderboard = async () => {
  // implement
};

module.exports = {
  SendMatches,
  // SendMatch,
  SendLeaderboard,
  Logging: {
    SendErrorReport,
    SendInfoReport,
  },
};
