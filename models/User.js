const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: { type: String, trim: true },
  password: String,
});

module.exports = mongoose.model("User", userSchema);
