const express = require("express");
const router = express.Router();
const JobberQuality = require("../game/JobberQuality");

const { getAllGames, getGame, createGame } = require("../games-handler");
const { readMapFromFile } = require("../game/util");

router.get("/game-list", (req, res) => {
  const gameArray = [];
  const games = getAllGames();
  for (const gameName in games) {
    const gameInfo = { name: gameName };
    const gameObj = games[gameName];

    gameInfo.maxPlayers = gameObj.maxPlayers;
    gameInfo.mapName = gameObj.mapName;
    gameInfo.currentPlayers = Object.keys(gameObj.players).length;
    gameInfo.locked = gameObj.locked;

    gameArray.push(gameInfo);
  }

  res.status(200).json(gameArray);
});

router.post("/create-game", async (req, res) => {
  let { id, mapName, jobberQuality, maxPlayers, locked, password } = req.body;
  if (!id) {
    res.status(401).json({ message: "Must specify an id for the game" });
    return;
  }

  if (!mapName) {
    res
      .status(401)
      .json({ message: "Must specify mapName that the game will be using" });
    return;
  }

  if (!maxPlayers) {
    res.status(401).json({ message: "Must specify maxPlayers field" });
    return;
  }

  if (!locked) {
    res.status(401).json({
      message:
        "Must specify locked field, if the game is locked or not (using password)",
    });
    return;
  }

  if (!password) password = "";
  if (!jobberQuality) jobberQuality = "ELITE";

  try {
    const map = await readMapFromFile(mapName);
    createGame(
      id,
      map,
      JobberQuality[jobberQuality],
      mapName,
      maxPlayers,
      locked,
      password
    );
    res.status(201).json({ message: "Created game successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

router.put("/start-game/:gameId", (req, res) => {
  const { gameId } = req.params;
  const game = getGame(gameId);
  if (!game) {
    res.status(404).json({ message: `Game not found with id ${gameId}` });
    return;
  }

  game.start();
  console.log("Starting game: ", gameId);
  res.status(200).json({ message: "Game started successfully" });
});

router.put("/stop-game/:gameId", (req, res) => {
  const { gameId } = req.params;
  const game = getGame(gameId);

  if (!game) {
    res.status(404).json({ message: `Game not found with id ${gameId}` });
    return;
  }

  game.stop();
  console.log("Stopped game: ", gameId);
  res.status(200).json({ message: "Game stopped successfully" });
});

module.exports = router;
