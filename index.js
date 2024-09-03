require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const db = require("./database/index.js");
const { Logging } = require("./discord/discord.js");

const Q_Helper = require("./analysers/process");
const scheduledCheck = require("./schedule/schedule");

global.chalk = require("chalk");

const app = express();
const port = 3098;
app.use(bodyParser.json());

db.Database.connection.on("connected", async () => {
  console.log(chalk.yellow.italic("Connected to MongoDB"));
  await Logging.SendInfoReport(
    `Starting...\nConnected to ${db.Database.connection._connectionString}`
  );

  const matchQ = db.Database.Queue.MatchQueue.watch();

  matchQ.on("change", async (change) => {
    if (change.operationType === "insert") {
      console.log(
        chalk.yellow.italic(
          `New match added to queue: ${change.fullDocument.matchId}`
        )
      );
      await Q_Helper();
    }
  });

  // check queue to see if there are any pending matches and process
  console.log(chalk.yellow.italic("Syncing any pending matches..."));
  Q_Helper();

  //start probing for new matches
  scheduledCheck();
});

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// When you want to close the server:
server.close();

// application flow
// 1. for all players in the database, check to see if they have any new matches.
//    each player has a list of recent matches (past 14 days) stored as an array of guids.
//    if anyone has a new match, check everyones matches and aggregate as two players could have been in the same match
// 2. for each match, check to see if it has been processed already
//    if it has, skip it
// 3. process the match and store data.
//    store the match id, date, map, game mode, and player stats
//    we need a way to ensure that we don't process the same match twice and that all matches get processed even when we have down time
