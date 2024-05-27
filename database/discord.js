const db = require('./database.js')

setWebhookMessageId = async (webhookUrl, messageId) => {
    var webhook = getWebhookMessageId(webhookUrl)
    if (!webhook) {
        webhook = await db.Webhook.create({
            webhookUrl: webhookUrl,
            messageId: messageId,
            ts: Date.now()
        })
    }
    else {
        webhook.messageId = messageId
        webhook.ts = Date.now()
        webhook.save()
    }
}

getWebhookMessageId = async (webhookUrl) => {
    var webhook = await db.Webhook.findOne({ webhookUrl: webhookUrl }).exec()
    if (webhook) {
        return webhook.messageId
    } else {
        return null
    }
}

getWebhook = async (webhookUrl) => {
    var webhook = await db.Webhook.findOne({ webhookUrl: webhookUrl }).exec()
    if (webhook) {
        return webhook
    } else {
        return null
    }
}

module.exports = {
    setWebhookMessageId,
    getWebhookMessageId,
    getWebhook
}