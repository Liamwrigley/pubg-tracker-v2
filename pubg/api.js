var urls = require('./urls.json')
const axios = require('axios');

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const headers = {
    'Authorization': `Bearer ${process.env.PUBG_API_KEY}`,
    "Accept": " application/vnd.api+json"
}

let cachedSeasonId = null;
let cacheTimestamp = null;

const getSeasonId = async () => {
    const now = Date.now();
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

    if (cachedSeasonId !== null && now - cacheTimestamp < oneDayInMilliseconds) {
        return Promise.resolve(cachedSeasonId);
    }

    var url = urls.getSeasons;
    return axios.get(url, { headers })
        .then(response => {
            if (response.status !== 200)
                throw new Error(JSON.stringify({
                    status: response.status,
                    body: response.data
                }));
            var data = response.data.data;
            cachedSeasonId = data.find(s => s.attributes.isCurrentSeason)?.id.split('-').pop() || "-1";
            cacheTimestamp = now;
            return cachedSeasonId;
        })
        .catch(error => {
            throw new Error(JSON.stringify({
                status: error.response.status,
                body: error.response.data
            }));
        });
};

//#region player endpoints
const getPlayerByName = async (name) => {
    var url = urls.getPlayersByNames + name;
    try {
        const response = await axios.get(url, { headers });
        if (response.status !== 200) {
            throw new Error(JSON.stringify({
                status: response.status,
                body: response.data
            }));
        }
        var data = response.data.data[0];
        return {
            name: data.attributes.name,
            id: data.id
        };
    } catch (error) {
        throw new Error(JSON.stringify({
            status: error.response.status,
            body: error.response.data
        }));
    }
};

const getPlayerById = async (id) => {
    var url = urls.getPlayerById + id;
    try {
        const response = await axios.get(url, { headers });
        if (response.status !== 200) {
            throw new Error(JSON.stringify({
                status: response.status,
                body: response.data
            }));
        }
        var data = response.data.data[0];
        return {
            name: data.attributes.name,
            id: data.id
        };
    } catch (error) {
        throw new Error(JSON.stringify({
            status: error.response.status,
            body: error.response.data
        }));
    }
};


const getPlayerSeasonHistory = async (players) => {
    var seasonId = await getSeasonId()
    var urlParts = urls.getPlayersSeason

    var batchedPlayers = []
    for (let i = 0; i < players.length; i += 10) {
        batchedPlayers.push(players.slice(i, i + 10));
    }

    const requests = batchedPlayers.map((batch) => {
        var playerIds = batch.map(p => p.id).join(",")
        var url = `${urlParts.part1}${seasonId}${urlParts.part2}${playerIds}`
        return axios.get(url, { headers });
    });

    const responses = await Promise.allSettled(requests);

    const successfulResponses = responses
        .filter(response => response.status === 'fulfilled')
        .map(response => response.value);

    const aggregatedResponse = await successfulResponses.reduce(
        async (acc, response) => {
            var res = await response.data;
            return (await acc).concat(res.data);
        }, []
    );

    return aggregatedResponse;
}


const getAllPlayersMatches = async (players) => {

    var batchedPlayers = []
    for (let i = 0; i < players.length; i += 10) {
        batchedPlayers.push(players.slice(i, i + 10));
    }

    const requests = batchedPlayers.map((batch) => {
        var url = `${urls.getPlayersByNames}${batch.join(",")}`
        return axios.get(url, { headers });
    });

    const responses = await Promise.allSettled(requests);

    const matchIds = new Set();

    responses.forEach(response => {
        if (response.status === 'fulfilled') {
            response.value.data.data.forEach(player => {
                player.relationships.matches.data.forEach(match => {
                    matchIds.add(match.id);
                });
            });
        }
    });

    return matchIds;
}
//#endregion

//#region match
const getMatchById = async (matchId) => {
    var url = urls.getMatchById + matchId;
    let retries = 0;

    while (retries <= MAX_RETRIES) {
        try {
            const matchPromise = axios.get(url, { headers });
            const seasonPromise = await getSeasonId();

            const [matchResponse, seasonId] = await Promise.all([matchPromise, seasonPromise]);

            if (matchResponse.status !== 200) {
                throw new Error(JSON.stringify({
                    status: matchResponse.status,
                    body: matchResponse.data
                }));
            }
            return { matchData: matchResponse.data, seasonId };
        } catch (error) {
            if (error.response && error.response.status === 504) {
                retries++;
                console.log(`getMatchById for ${matchId} failed\n\tRetrying ${retries} of ${MAX_RETRIES}...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                console.log(error)
                throw new Error(error);
            }
        }
    }

};
//#endregion

module.exports = {
    getSeasonId,
    Player: {
        getPlayerByName,
        getPlayerById,
        getAllPlayersMatches,
        getPlayerSeasonHistory
    },
    Match: {
        getMatchById
    }
}