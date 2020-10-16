const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

router.get("/whoami", verifyToken, (req, res) => {
  res.status(200).json({ username: req.username });
});

module.exports = router;
