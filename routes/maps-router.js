const express = require("express");
const router = express.Router();
const moment = require("moment");
const Map = require("../models/Map");
const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");
const { addSafeZone } = require("../game/util");

const { getAllAvailableMaps } = require("../game/util");

// Legacy code route. Use /dbmaps routes until it's safe to remove/edit this route
router.get("/", (req, res) => {
  getAllAvailableMaps()
    .then((files) => {
      res.status(200).json(files);
    })
    .catch((err) => {
      console.err("Error, could not get list of maps: ", err);
      res.status(500).json(err);
    });
});

router.get("/dbmaps", (req, res) => {
  Map.find({}, "title createdBy")
    .populate("createdBy", "username")
    .then((documents) => {
      res.status(200).json(documents);
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});

router.get("/dbmaps/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const maps = await Map.find({ _id: id }).populate("createdBy", "username");
    if (maps.length === 0) {
      res.status(404).json({ message: "Could not find map by that id" });
      return;
    }
    const foundMap = maps[0];
    const newLayout = addSafeZone(foundMap.layout);
    foundMap.layout = newLayout;
    res.status(200).json(foundMap);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Create a new map
router.post("/", verifyToken, async (req, res) => {
  const { title, layout } = req.body;

  if (!title || !layout) {
    res
      .status(400)
      .json({ message: "Title and layout fields are required in the body" });
    return;
  }
  try {
    const users = await User.find({ username: req.username });
    const user = users[0];
    const map = new Map({
      title: title,
      layout: layout,
      createdBy: user._id,
      createdAt: moment().format(),
    });
    await map.save();
    res.status(201).json({ message: "Map successfully created" });
  } catch (err) {
    if (err.code && err.code === 11000)
      res.status(400).json({ error: "Map name already taken" });
    else res.status(500).json({ error: err });
  }
});

module.exports = router;
