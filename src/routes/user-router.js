const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const User = require("../models/User");
const bcrypt = require("bcrypt");

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
    .then(async (docs) => {
      if (docs.length === 0)
        return Promise.reject({
          statusCode: 404,
          message: "Could not find user by that id",
        });

      const userDoc = docs[0];
      if (email) userDoc.email = email;
      if (password) {
        try {
          const hash = await bcrypt.hash(password, 6);
          userDoc.password = hash;
        } catch (exc) {
          return Promise.reject(exc);
        }
      }

      return userDoc.save();
    })
    .then(() => {
      res.status(200).json({ message: "Successfully updated user" });
    })
    .catch((err) => {
      if (err.statusCode) {
        res.status(err.statusCode).json({ error: err.message });
      } else if (err.code && err.code === 11000) {
        res.status(400).json({ error: "Email is already in use" });
      } else {
        console.log("Error updating user: ", err);
        res.status(500).json({ error: err });
      }
    });
});
module.exports = router;
