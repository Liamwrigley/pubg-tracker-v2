const mongoose = require('mongoose');
const chalk = require('chalk');
require('dotenv').config();

const resetStats = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Reset player stats to an empty array
        const resetStatsResult = await mongoose.connection.db.collection("players").updateMany({}, { $set: { stats: [] } });
        console.log(chalk.green(`${resetStatsResult.modifiedCount} Player stats reset.`));

        const updateWebhooksResult = await mongoose.connection.db.collection("players").updateMany(
            {},
            { $unset: { matchWebhook: "", history: "" } },
            { $set: { matchWebhooks: [{ webhookUrl: "https://discord.com/api/webhooks/1244608490568286280/BL2MC7fR9FcusrxQlH4wAWTU40BUJ8se01s08VKR6PGr0HS3Ki6nRV9XVGZPQ3ptuvZu", type: 1, messageId: null, ts: Math.floor(Date.now() / 1000) }] } }
        );
        console.log(chalk.green(`${updateWebhooksResult.modifiedCount} 'matchWebhooks' reset and updated for players.`));


    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        mongoose.disconnect();
    }
};

resetStats();
