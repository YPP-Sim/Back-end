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

router.put("/update", verifyToken, (req, res) => {
  const { email, password } = req.body;
  User.find({ username: req.username })
    .then((docs) => {
      if (docs.length === 0)
        return Promise.reject({
          statusCode: 404,
          message: "Could not find user by that id",
        });

      const userDoc = docs[0];
      if (email) userDoc.email = email;
      if (password) userDoc.password = password;

      return userDoc.save();
    })
    .then(() => {
      res.status(200).json({ message: "Successfully updated user" });
    })
    .catch((err) => {
      if (err.statusCode) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: err });
      }
    });
});
module.exports = router;
