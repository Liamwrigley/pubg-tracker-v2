const chalk = require('chalk');
const mongoose = require('mongoose');

require('dotenv').config();
const removeHistory = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        // remove 'history' from all players
        const result = await mongoose.connection.db.collection("players").updateMany({}, { $unset: { history: "" } });
        console.log(chalk.red(`${result.deletedCount} History removed from players.`));
    } catch (error) {
        console.error('An error occurred while removing the history:', error);
    } finally {
        mongoose.disconnect();
    }
    process.exit();
}

removeHistory();