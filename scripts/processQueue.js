const Q_Helper = require('../analysers/process');
const indexMatch = require('../schedule/schedule')
const mongoose = require('mongoose');
require('dotenv').config();

const processQueue = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    await indexMatch(false).then(async () => {
        await Q_Helper();
    }).finally(async () => {
        await mongoose.disconnect();
    });
}

processQueue();