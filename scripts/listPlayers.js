const mongoose = require('mongoose');
const chalk = require('chalk');

require('dotenv').config();

const listPlayers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const players = await mongoose.connection.db.collection("players").find({}, { name: 1, matchWebhooks: 1 }).toArray();

        players.sort((a, b) => a.name.localeCompare(b.name)).forEach(player => {
            console.log(chalk`{green ${player.name}} {blue [${player.matchWebhooks && player.matchWebhooks.length || 0}]}`);
        });

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        mongoose.disconnect();
    }
};

listPlayers();
