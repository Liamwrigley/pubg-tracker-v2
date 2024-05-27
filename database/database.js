const mongoose = require('mongoose');
const moment = require('moment-timezone');
const { WebhookType } = require('discord.js');

mongoose.connect(process.env.MONGO_URI);

mongoose.connection.on('error', (err) => {
    console.error(`Error connecting to MongoDB: ${err}`);
});

mongoose.connection.on('disconnected', () => {
    console.error('Lost MongoDB connection...');
    // You can add logic here to try and reconnect if needed.
});


//#region schemas
const webhookType = Object.freeze({
    LEADERBOARD: 0,
    MATCH: 1,
});
const webhookSchema = new mongoose.Schema({
    webhookUrl: { type: String, required: true },
    type: { type: String, enum: Object.values(WebhookType), required: true },
    messageId: { type: String, required: false },
    ts: { type: Number, required: true, default: () => moment().utc().unix() }
});
const Webhook = mongoose.model('Webhook', webhookSchema);

const playerStatsSchema = new mongoose.Schema({
    seasonId: { type: Number, required: true },
    DBNOs: { type: Number, required: true },
    assists: { type: Number, required: true },
    boosts: { type: Number, required: true },
    damageDealt: { type: Number, required: true },
    deathType: { type: String, required: true },
    headshotKills: { type: Number, required: true },
    heals: { type: Number, required: true },
    killPlace: { type: Number, required: true },
    killStreaks: { type: Number, required: true },
    kills: { type: Number, required: true },
    longestKill: { type: Number, required: true },
    name: { type: String, required: true },
    playerId: { type: String, required: true },
    revives: { type: Number, required: true },
    rideDistance: { type: Number, required: true },
    roadKills: { type: Number, required: true },
    swimDistance: { type: Number, required: true },
    teamKills: { type: Number, required: true },
    timeSurvived: { type: Number, required: true },
    vehicleDestroys: { type: Number, required: true },
    walkDistance: { type: Number, required: true },
    weaponsAcquired: { type: Number, required: true },
    winPlace: { type: Number, required: true },
    wins: { type: Number, required: false, default: 0 },
    rounds: { type: Number, required: false, default: 0 }
}, { timestamps: true });
const PlayerStats = mongoose.model('PlayerStats', playerStatsSchema);

const teamSchema = new mongoose.Schema({
    teamId: { type: String, required: true },
    seasonId: { type: Number, required: true },
    winPlace: { type: Number, required: true },
    players: { type: [playerStatsSchema], default: [] }
});
const Team = mongoose.model('Team', teamSchema);

const matchSchema = new mongoose.Schema({
    matchId: { type: String, required: true, unique: true, index: true },
    seasonId: { type: Number, required: true },
    gameMode: { type: String, required: true },
    matchType: { type: String, required: true },
    mapName: { type: String, required: true },
    createdAt: { type: Number, required: true },
    aiParticipantsCount: { type: Number, required: true },
    humanParticipantsCount: { type: Number, required: true },
    teams: { type: [teamSchema], default: [] },

    ts: { type: Number, required: true, default: () => moment().utc().unix() },
});

matchSchema.statics.easyAdd = async function (match) {
    try {
        const db_match = {
            matchId: match.matchId,
            seasonId: match.seasonId,
            gameMode: match.gameMode,
            matchType: match.matchType,
            mapName: match.mapName,
            createdAt: moment(match.createdAt).utc().unix(),
            aiParticipantsCount: match.aiParticipantsCount,
            humanParticipantsCount: match.humanParticipantsCount,
            teams: []
        };

        for (const [teamId, players] of Object.entries(match.teamStats)) {

            const db_team = {
                teamId: teamId,
                winPlace: players[0].winPlace,
                seasonId: match.seasonId,
                players: []
            };

            for (const playerStats of players) {
                const db_playerStats = {
                    seasonId: match.seasonId,
                    ...playerStats
                };
                db_team.players.push(db_playerStats);

                const player = await Player.findOne({ id: playerStats.playerId }).exec();
                if (player) {
                    // if we dont find a player - we dont care about that user. Only store in team.
                    await player.addStats({ seasonId: match.seasonId, ...playerStats });
                }
            }

            db_match.teams.push(db_team);
        }

        const _match = new Match(db_match);
        return await _match.save();

    } catch (error) {
        if (error.code === 11000) { // ignore duplicate errors.
            console.error(`Duplicate matchId: ${match.matchId} - ignoring...`);
        } else {
            throw error;
        }
    } finally {
    }
}


// matchSchema.pre('save', async (next) => {
//     // if this is saving, that means we can complete the match from the queue
//     const matchQueue = await MatchQueue.findOne({ matchId: this.matchId });
//     if (matchQueue) {
//         await matchQueue.setStatus(QueueStatus.COMPLETE);
//     }
// });
const Match = mongoose.model('Match', matchSchema);

const playerSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    ts: { type: Number, required: true, default: () => moment().utc().unix() },
    stats: { type: [playerStatsSchema], default: [] }
}, { timestamps: true });

playerSchema.methods.addStats = async function (incomingStats) {
    const playerStat = this.stats.find(stat => stat.seasonId === incomingStats.seasonId);
    if (playerStat) {
        // Update the playerStat with the values from playerStats
        playerStat.DBNOs += incomingStats.DBNOs;
        playerStat.assists += incomingStats.assists;
        playerStat.boosts += incomingStats.boosts;
        playerStat.damageDealt += incomingStats.damageDealt;
        playerStat.headshotKills += incomingStats.headshotKills;
        playerStat.heals += incomingStats.heals;
        playerStat.killStreaks = Math.max(playerStat.killStreaks, incomingStats.killStreaks);
        playerStat.kills += incomingStats.kills;
        playerStat.longestKill = Math.max(playerStat.longestKill, incomingStats.longestKill);
        playerStat.revives += incomingStats.revives;
        playerStat.rideDistance += incomingStats.rideDistance;
        playerStat.roadKills += incomingStats.roadKills;
        playerStat.swimDistance += incomingStats.swimDistance;
        playerStat.teamKills += incomingStats.teamKills;
        playerStat.timeSurvived += incomingStats.timeSurvived;
        playerStat.vehicleDestroys += incomingStats.vehicleDestroys;
        playerStat.walkDistance += incomingStats.walkDistance;
        playerStat.weaponsAcquired += incomingStats.weaponsAcquired;
        playerStat.wins += incomingStats.winPlace === 1 ? 1 : 0;
        playerStat.rounds += 1;
    } else {
        const newStats = new PlayerStats(incomingStats)
        this.stats.push(newStats);
    }
    await this.save();
}

const Player = mongoose.model('Player', playerSchema);


const QueueStatus = Object.freeze({
    PENDING: 0,
    PROCESSING: 1,
    FAILED: 2,
    COMPLETE: 3,
    IGNORED: 4
});
const matchQueueSchema = new mongoose.Schema({
    matchId: { type: String, required: true, unique: true, index: true },
    status: { type: Number, required: true, default: QueueStatus.PENDING, enum: Object.values(QueueStatus) },
    ts: { type: Number, required: true, default: () => moment().utc().unix(), index: true },
});
matchQueueSchema.methods.setStatus = function (newStatus) {
    // Check if the new status is valid
    if (!Object.values(QueueStatus).includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
    }

    // Set the new status
    this.status = newStatus;

    // Save the document
    return this.save();
};
matchQueueSchema.statics.pickNext = async function () {
    const now = moment().utc().unix();
    return this.findOneAndUpdate(
        { status: QueueStatus.PENDING },
        { status: QueueStatus.PROCESSING, ts: now },
        { new: true }
    ).sort({ ts: 1 }).exec();
}
const MatchQueue = mongoose.model('MatchQueue', matchQueueSchema);

//#endregion

module.exports = {
    connection: mongoose.connection,
    Webhook: {
        WebhookType: webhookType,
        Webhook: Webhook
    },
    Player: Player,
    // History: History,
    PlayerStats: PlayerStats,
    Team: Team,
    Match: Match,
    Queue: {
        MatchQueue: MatchQueue,
        QueueStatus: QueueStatus
    }
}
