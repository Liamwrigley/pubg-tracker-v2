const API = require('./api.js');
const mappings = require('./mappings.json');

// Check if gameMode is in GAME_MODES_TO_TRACK
const config = require('../config.json');
const GameModesToTrack = config.GAME_MODES_TO_TRACK;
const MatchTypesToTrack = config.MATCH_TYPES_TO_TRACK;


// if (!gameModesToTrack.includes(gameMode)) {
//     return null; // Exclude the match
// }

const getMatchData = async (matchId, playerNames) => {
    const { matchData, seasonId } = await API.Match.getMatchById(matchId);

    // Extract game mode, creation date, and map name
    const gameMode = matchData.data.attributes.gameMode;
    const matchType = matchData.data.attributes.matchType;
    const createdAt = matchData.data.attributes.createdAt;
    const mapName = mappings.map[matchData.data.attributes.mapName];

    // Check if match is of a type we care about
    if (!GameModesToTrack.includes(gameMode) || !MatchTypesToTrack.includes(matchType)) {
        return null; // Exclude the match
    }

    // Initialize counts for AI and human participants
    let aiParticipantsCount = 0;
    let humanParticipantsCount = 0;

    // Index participants by ID for quick access, and count AI and human participants
    const participantsById = {};
    matchData.included.filter(item => item.type === 'participant').forEach(participant => {
        if (participant.attributes.stats.playerId.startsWith("ai.")) {
            aiParticipantsCount++;
        } else {
            humanParticipantsCount++;
            participantsById[participant.id] = participant.attributes.stats;
        }
    });

    // Determine teams and identify if they contain a tracked player
    const teamStats = {};
    matchData.included.filter(item => item.type === 'roster').forEach(roster => {
        const teamMembersIds = roster.relationships.participants.data.map(participant => participant.id);
        const containsTrackedPlayer = teamMembersIds.some(id => playerNames.includes(participantsById[id]?.name));

        if (containsTrackedPlayer) {
            teamStats[roster.id] = teamMembersIds.map(id => participantsById[id]);
        }
    });

    // // Aggregate team stats
    // let teamStats = {};
    // Object.keys(teamIdToPlayerIds).forEach(teamId => {
    //     teamStats[teamId] = teamIdToPlayerIds[teamId].map(playerId => participantsById[playerId]);
    // });

    // Output the results
    // console.log(`Game Mode: ${gameMode}`);
    // console.log(`Created At: ${createdAt}`);
    // console.log(`Map Name: ${mapName}`);
    // console.log(`AI Participants Count: ${aiParticipantsCount}`);
    // console.log(`Human Participants Count: ${humanParticipantsCount}`);
    // console.log('Team:', Object.values(teamStats)[0].map(p => p.name));
    // console.log('Team Stats:', teamStats);

    // this means that the match had more than 1 team being tracked
    // if (Object.values(teamStats).length > 1) {
    //     Object.values(teamStats).map(team => team.map(p => p.name))
    // }

    return {
        seasonId: Number(seasonId),
        matchId: matchId,
        gameMode: gameMode,
        matchType: matchType,
        mapName: mapName,
        createdAt: createdAt,
        aiParticipantsCount: aiParticipantsCount,
        humanParticipantsCount: humanParticipantsCount,
        teamStats: teamStats
    };
}


module.exports = {
    getMatchData
}