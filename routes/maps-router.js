const express = require("express");
const router = express.Router();

const { getAllAvailableMaps } = require("../game/util");

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

module.exports = router;
