const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const moment = require("moment");
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  invalidateRefreshToken,
} = require("../helpers/jwt_helper");

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
          res.status(404).json({ usernameError: "Invalid username" });
          return;
        }
        const user = docs[0];
        return bcrypt.compare(password, user.password);
      })
      .then((result) => {
        if (!result) {
          res.status(400).json({ passwordError: "Invalid password" });
          return;
        }

        // Create access/refresh tokens

        signAccessToken(username)
          .then((token) => {
            signRefreshToken(username).then((refreshToken) => {
              res.status(200).json({
                message: "Successful login",
                accessToken: token,
                refreshToken,
              });
            });
          })
          .catch((err) => {
            console.log(err.message);
            res.status(500).json({ err: err.message });
          });
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

    User.countDocuments({ username })
      .then((count) => {
        if (count > 0) {
          // exists
          res.status(400).json({ usernameError: "Username already exists" });
          return Promise.reject("Username already exists");
        }
        return User.countDocuments({ email });
      })
      .then((count) => {
        if (count > 0) {
          res.status(400).json({ emailError: "Email is already in use" });
          return Promise.reject("Email already exists");
        }

        return bcrypt.hash(password, 6);
      })
      .then((hash) => {
        const user = new User({
          username,
          password: hash,
          email,
          createdAt: moment().format(),
        });

        return user.save();
      })
      .then(() => {
        res.status(200).json({ msg: "Success" });
      })
      .catch((err) => {
        if (!res.headersSent) res.status(500).json({ error: err });
      });
  }
);

router.post("/logout", body("refreshToken").exists(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { refreshToken } = req.body;

  try {
    const username = await verifyRefreshToken(refreshToken);
    invalidateRefreshToken(username);
    res.status(200).json({ msg: "Successfully logged out on server" });
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

router.post(
  "/refresh",
  [body("refreshToken").notEmpty().isString()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { refreshToken } = req.body;
    try {
      const username = await verifyRefreshToken(refreshToken);

      const accessToken = await signAccessToken(username);
      const newRefToken = await signRefreshToken(username);

      res.status(200).json({ accessToken, refreshToken: newRefToken });
    } catch (err) {
      res.status(401).json({ error: "Could not verify refresh token" });
    }
  }
);

router.post("/validate-refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res
      .status(400)
      .json({ error: "refreshToken is a required field for this endpoint" });
    return;
  }

  let valid = false;
  try {
    await verifyRefreshToken(refreshToken);
    valid = true;
  } catch (err) {
    valid = false;
  }

  res.status(200).json({ valid });
});

module.exports = router;
