const chalk = require('chalk');
const mongoose = require('mongoose');

require('dotenv').config();
const resetQueue = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const matchQ_result = await mongoose.connection.db.collection("matchqueues").deleteMany({});
        console.log(chalk.red(`${matchQ_result.deletedCount} documents deleted from the queue collection.`));

        const match_result = await mongoose.connection.db.collection("matches").deleteMany({});
        console.log(chalk.red(`${match_result.deletedCount} documents deleted from the matches collection.`));
    } catch (error) {
        console.error('An error occurred while resetting the queue:', error);
    } finally {
        mongoose.disconnect();
    }
    process.exit();
}

resetQueue();