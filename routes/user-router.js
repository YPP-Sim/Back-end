const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const User = require("../models/User");

router.get("/whoami", verifyToken, (req, res) => {
  res.status(200).json({ username: req.username });
});

router.get("/details", verifyToken, (req, res) => {
  User.find({ username: req.username }, "username email createdAt")
    .then((docs) => {
      if (docs.length === 0) {
        res.status(404).json({ error: "Could not find user by that username" });
        return;
      }
      res.status(200).json(docs[0]);
    })
    .catch((err) => {
      res.status(500).json({ err });
    });
});
module.exports = router;
