const mongoose = require('mongoose');
const chalk = require('chalk');
require('dotenv').config();

const addWebhook = async (webhookUrl, identifier) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const player = await mongoose.connection.db.collection("players").findOne({ id: identifier });

        if (!player) {
            console.log(chalk.red(`Player with id ${identifier} not found.`));
            return;
        }

        const newWebhook = { webhookUrl, type: 1, messageId: null, ts: Math.floor(Date.now() / 1000) };
        // player.matchWebhooks.push(newWebhook);
        const addedWebhook = await mongoose.connection.db.collection("players").updateOne(
            { id: identifier },
            { $push: { matchWebhooks: newWebhook } }
        )

        console.log(chalk.green(`Match webhook added to player ${player.name}.`));
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        mongoose.disconnect();
    }
};

// Assuming you call the script with the required parameters
const [, , identifier, webhookUrl] = process.argv;
if (!webhookUrl || !identifier) {
    console.log(chalk.red('Usage: node addMatchWebhook.js <playerId> <webhookUrl>'));
    process.exit(1);
}

addWebhook(webhookUrl, identifier);
