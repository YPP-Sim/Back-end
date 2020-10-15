const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    trim: true,
    required: "username is required",
    unique: true,
  },
  email: { type: String, required: "email is required", unique: true },
  password: { type: String, required: "password is required" },
});

module.exports = mongoose.model("User", userSchema);
