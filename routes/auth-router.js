const express = require("express");
const router = express.Router();

router.post("/login", (req, res) => {
  res.status(200).json({ token: "ok" });
});

router.post("/register", (req, res) => {
  res.status(200).json({ token: "oks" });
});

module.exports = router;
