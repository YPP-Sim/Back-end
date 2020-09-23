const express = require("express");
const router = express.Router();
const JobberQuality = require("../game/JobberQuality");
const jwt = require("jsonwebtoken");
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
    gameInfo.status = gameObj.gameStatus;
    gameArray.push(gameInfo);
  }

  res.status(200).json(gameArray);
});

router.post("/create-game", async (req, res) => {
  let {
    id,
    mapName,
    jobberQuality,
    maxPlayers,
    locked,
    password,
    gameOwner,
  } = req.body;
  if (!id) {
    res.status(400).json({ message: "Must specify an id for the game" });
    return;
  }

  // If there already is a game with that id
  if (getGame(id)) {
    res.status(409).json({ message: "Game with that id already exists" });
    return;
  }

  if (!mapName) {
    res
      .status(400)
      .json({ message: "Must specify mapName that the game will be using" });
    return;
  }

  if (!maxPlayers) {
    res.status(400).json({ message: "Must specify maxPlayers field" });
    return;
  }

  if (!("locked" in req.body)) {
    res.status(400).json({
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
      password,
      gameOwner
    );
    res.status(201).json({ message: "Created game successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

router.post("/join-game-request", (req, res) => {
  const { gameId, requestedPlayerName, password } = req.body;
  if (!gameId || !requestedPlayerName) {
    res
      .status(400)
      .json({ message: "gameId and requestedPlayerName fields are required" });
    return;
  }
  const game = getGame(gameId);
  if (game.getPlayer(requestedPlayerName)) {
    // A user with the requested player name already exists...
    res.status(400).json({ usernameError: "User name already in use" });
    return;
  }

  if (game.hasPassword()) {
    if (!password) {
      res.status(400).json({ passwordError: "Password is required" });
      return;
    }
    if (game.password !== password) {
      res.status(400).json({ passwordError: "Password is incorrect" });
      return;
    }
  }
  // Create JWT token and send it.
  jwt.sign(
    { gameId, playerName: requestedPlayerName },
    process.env.JWT_KEY,
    (err, token) => {
      if (err) {
        console.log("Error: ", err);
        res.status(500).json({ message: "Server error, check logs" });
      } else res.status(200).json({ token });
    }
  );
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
