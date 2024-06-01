const crypto = require('crypto')
const db = require('../database/index.js');
const PUBG_HELPERS = require("../pubg/helpers.js")
const cliProgress = require('cli-progress');
const discordHelper = require('../discord/discord.js');
const matchOutputHelper = require('../outputs/buildMatchHistory.js');

const formatAndSendMatchToDiscord = async (players, match) => {
    // find all webhook urls to send for.
    const matchingPlayers = match.teams
        .flatMap(t => t.players)
        .map(p => players.find(pl => pl.name === p.name))
        .filter(Boolean)

    const webhooks = matchingPlayers.flatMap(p => p.webhooks.map(w => w.webhookUrl));

    // keep only unique webhooks
    const uniqueWebhooks = [...new Set(webhooks.flat())];

    match.matchingPlayerCount = matchingPlayers.length;

    // create images
    let images = null
    images = await matchOutputHelper.CreateMatchHistory(match);

    await discordHelper.SendMatches(uniqueWebhooks, match, images);
}


// This function assigns team names to each team in the match based on the players' names.
// It uses a hash function to generate a unique hash for each team and then selects a team name from the provided list of team names.
const setTeamNames = (match) => {
    const teamNames = ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT", "GOLF", "HOTEL", "INDIA", "JULIET", "KILO", "LIMA", "MIKE", "NOVEMBER", "OSCAR", "PAPA", "QUEBEC", "ROMEO", "SIERRA", "TANGO", "UNIFORM", "VICTOR", "WHISKEY", "XRAY", "YANKEE", "ZULU"];

    match.teams.forEach(team => {
        const playerString = team.players.map(p => p.name).sort().join('');
        const hash = crypto.createHash('sha256').update(playerString).digest('hex');
        const hashNumber = parseInt(hash, 16);
        team.teamName = teamNames[hashNumber % teamNames.length];
    })
}

const processPendingMatch = async (players, match) => {
    try {
        var matchData = await PUBG_HELPERS.getMatchData(match.matchId, players.map(p => p.name));
        if (matchData === null) {
            // this means that the match was of a type that we dont care about
            await match.setStatus(db.Database.Queue.QueueStatus.IGNORED);
            console.log('Match ignored')
            return;
        }

        var savedMatch = await db.Database.Match.easyAdd(matchData);

        setTeamNames(savedMatch);
        await formatAndSendMatchToDiscord(players, savedMatch);

        await match.setStatus(db.Database.Queue.QueueStatus.COMPLETE);
    } catch (err) {
        console.log(`Error processing match (${match.matchId}): ${err}`);
        await match.setStatus(db.Database.Queue.QueueStatus.FAILED);
    }
}

const processPendingMatches = async () => {

    // get all player names
    const players = await db.Queries.Player.getAllNamesAndWwebhooks();
    const pendingMatches = await db.Queries.Queue.getAllPending();

    console.log(`Processing ${pendingMatches.length} pending matches`);

    const bar = new cliProgress.Bar({
        format: '| {bar} | {percentage}% | {value}/{total}',
    });
    bar.start(pendingMatches.length, 0);
    bar.setTotal(pendingMatches.length);

    for (const match of pendingMatches) {
        await processPendingMatch(players, match);
        bar.increment();
        bar.render()
    }

    process.exit();
}

processPendingMatches();






// I want a process that will kick off once all of the matches in the queue have been processed.