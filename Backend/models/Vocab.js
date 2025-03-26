// server/models/Vocab.js
const mongoose = require("mongoose");

const VocabSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
    index: true,
  },
  definition: {
    type: String,
    required: true,
  },
  translation: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // You can add other fields like: exampleSentence, partOfSpeech, etc.
});

// Compound index for search optimization (optional but recommended)
VocabSchema.index({ word: "text", definition: "text" });

module.exports = mongoose.model("Vocab", VocabSchema);
