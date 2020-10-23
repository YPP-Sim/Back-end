const mongoose = require("mongoose");

const mapSchema = mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: "title is required",
    unique: true,
  },
  layout: { type: [[Number]], required: "layout data is required" },
  createdAt: Date,
  createdBy: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Map", mapSchema);
