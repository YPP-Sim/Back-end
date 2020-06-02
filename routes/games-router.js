const express = require("express");
const router = express.Router;
const { getAllGameIds, getGame, createGame } = require("../games-handler");

router.get("/game-list", (req, res) => {
  res.status(200).json(getAllGameIds());
});

router.post("/create-game", (req, res) => {
  const { id, mapName } = req.body;
  if (!id) {
    res.status(401).json({ message: "Must specify an id for the game" });
    return;
  }

  if (!mapName) {
    res
      .status(401)
      .json({ message: "Must specify a map that the game will be using" });
    return;
  }

  //   createGame();
});

module.exports = router;
