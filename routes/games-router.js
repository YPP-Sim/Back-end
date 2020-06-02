const express = require("express");
const router = express.Router();
const JobberQuality = require("../game/JobberQuality");

const { getAllGameIds, getGame, createGame } = require("../games-handler");
const { readMapFromFile } = require("../game/util");

router.get("/game-list", (req, res) => {
  res.status(200).json(getAllGameIds());
});

router.post("/create-game", async (req, res) => {
  let { id, mapName, jobberQuality } = req.body;
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

  if (!jobberQuality) jobberQuality = "ELITE";

  try {
    const map = await readMapFromFile(mapName);
    createGame(id, map, JobberQuality[jobberQuality]);
    res.status(201).json({ message: "Created game successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err });
  }
});

module.exports = router;
