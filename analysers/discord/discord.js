const {
    WebhookClient,
    EmbedBuilder
} = require('discord.js');
require('dotenv').config();
const db = require('../database/discord.js');

const webhookUrl = process.env.WEBHOOK_URL;


const SendMatch = async () => {
    const wh = new WebhookClient({
        id: "BOT WATCHR",
        url: meta.webhookUrl
    })

    var webhook = await db.getWebhook(webhookUrl);

    if (!webhook) {
        console.log("No webhook found")
        return;
    }

    if (webhook.type == db.webhookType.MATCH) {

    }

}

const SendLeaderboard = async () => {
    // implement
}

module.exports = {
    SendMatch,
    SendLeaderboard
}