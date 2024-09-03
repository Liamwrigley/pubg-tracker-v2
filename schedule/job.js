const db = require("../database/index.js");
const PUBG_API = require("../pubg/api.js");

const checkForNewMatches = async () => {
  const players = await db.Queries.Player.getAllNames();
  const existingMatches = (await db.Queries.Queue.getAllIds()).map(
    (match) => match.matchId
  );

  const matches = Array.from(
    await PUBG_API.Player.getAllPlayersMatches(players)
  );
  const matchesToIndex = matches.filter(
    (match) => !existingMatches.includes(match)
  );

  if (matchesToIndex.length > 0) {
    const bulkOps = matchesToIndex.map((match) => ({
      updateOne: {
        filter: { matchId: match },
        update: { matchId: match },
        upsert: true,
      },
    }));

    await db.Database.Queue.MatchQueue.bulkWrite(bulkOps, {
      ordered: false,
    });
  }

  process.exit();
};

checkForNewMatches();
