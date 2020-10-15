const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { body, validationResult } = require("express-validator");

router.post(
  "/login",
  [
    body("username").notEmpty().isString().isAlphanumeric().trim(),
    body("password").notEmpty().isString().isLength({ min: 4 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;

    User.find({ username })
      .then((docs) => {
        if (docs.length === 0) {
          res.status(404).json({ message: "User does not exist" });
          return;
        }
        const user = docs[0];
        return bcrypt.compare(password, user.password);
      })
      .then((result) => {
        if (!result) {
          res.status(400).json({ message: "Invalid password" });
          return;
        }

        // Create access/refresh tokens

        res.status(200).json({ message: "Successful login" });
      })
      .catch((err) => {
        console.log(err.message);
        res.status(500).json({ error: err.message });
      });
  }
);

router.post(
  "/register",
  [
    body("username")
      .notEmpty()
      .withMessage("Username must not be empty")
      .isString()
      .isAlphanumeric()
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must have a length of atleast 3"),
    body("password")
      .notEmpty()
      .isString()
      .isLength({ min: 4 })
      .withMessage("password must have a length of atleast 4"),
    body("email")
      .isEmail()
      .withMessage("Email is not a valid email")
      .normalizeEmail(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password, email } = req.body;

    User.count({ username })
      .then((count) => {
        if (count > 0) {
          // exists
          res.status(400).json({ error: "Username already exists" });
          return;
        }
        return User.count({ email });
      })
      .then((count) => {
        if (count > 0) {
          res.status(400).json({ error: "Email is already in use" });
          return;
        }

        return bcrypt.hash(password, 6);
      })
      .then((hash) => {
        const user = new User({
          username,
          password: hash,
          email,
        });

        return user.save();
      })
      .then(() => {
        res.status(200).json({ msg: "Success" });
      })
      .catch((err) => {
        console.log(err.message);
        res.status(500).json({ error: err.message });
      });
  }
);

router.post("/refresh", (req, res) => {
  res.status(200).json({ msg: "Not available yet" });
});

module.exports = router;
