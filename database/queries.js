const chalk = require('chalk');
const db = require('./database.js')
const QueueStatus = db.Queue.QueueStatus;


//#region -------------------------------------------------------PLAYER-------------------------------------------------------
let cachedPlayers = null;

const player_add = async (player) => {
    var player = await db.Player.findOne({
        $or: [
            { id: player.id },
            { name: player.name }
        ]
    }).exec();

    if (!player) {
        player = await db.Player.create({
            ...player,
            name: player.name,
            history: []
        })

        // Clear the cache
        cachedPlayers = null;
    }
    console.log(chalk.red('Player already exists'))
};

// Get a player by name
const player_getByName = async (name) => {
    return await db.Player.findOne({ name: name }).exec()
};

// Get a player by id
const player_getById = async (id) => {
    return await db.Player.findOne({ id: id }).exec()
};

// Get all players
const player_getAll = async () => {
    if (cachedPlayers !== null) {
        return cachedPlayers;
    }

    const players = await db.Player.find({}, 'name id matchWebhooks').exec();

    cachedPlayers = players;
    return players;
};

// Get all names
const player_getAllNames = async () => {
    const players = await player_getAll();
    return players.map(player => player.name);
};

// Get all names and webhooks
const player_getAllNamesAndWwebhooks = async () => {
    const players = await player_getAll();
    return players.map(player => {
        return {
            name: player.name,
            webhooks: player.matchWebhooks
        }
    });
};
//#endregion -----------------------------------------------------PLAYER-----------------------------------------------------

//#region -------------------------------------------------------QUEUE-------------------------------------------------------
const queue_add = async (match) => {
    // todo: this might need to check if the match already exists
    await db.MatchQueue.Queue.create({
        id: match.id,
    })
}

const queue_getAllIds = async () => {
    return await db.Queue.MatchQueue.find({ status: { $ne: QueueStatus.FAILED } }, 'matchId').exec();
}

const queue_getAllPending = async () => {
    return await db.Queue.MatchQueue.find({ status: QueueStatus.PENDING }).sort({ ts: 1 }).exec();
}

const queue_getNext = async () => {
    const matchQueue = await db.Queue.MatchQueue.pickNext();
    return matchQueue;
}
//#endregion ----------------------------------------------------QUEUE-------------------------------------------------------


const getPlayersAndRecentMatches = async () => {
    const players = await db.Player.find({}, 'name').exec();
    const recentMatches = await db.Match.find({}, 'id').sort({ date: -1 }).limit(20).exec();

    return {
        players: players.map(player => player.name),
        recentMatches: recentMatches.map(match => match.id)
    };
}

module.exports = {
    Player: {
        add: player_add,
        getByName: player_getByName,
        getById: player_getById,
        getAll: player_getAll,
        getAllNames: player_getAllNames,
        getAllNamesAndWwebhooks: player_getAllNamesAndWwebhooks,
        getPlayersAndRecentMatches: getPlayersAndRecentMatches
    },
    Queue: {
        add: queue_add,
        getAllIds: queue_getAllIds,
        getAllPending: queue_getAllPending,
        getNext: queue_getNext
    },
    // Match: Match
}