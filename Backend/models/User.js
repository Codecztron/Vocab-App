// server/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["dev", "admin", "user"], // Add 'user' role
    required: true,
  },
  // Other user-related fields (e.g., email)
});

module.exports = mongoose.model("User", UserSchema);
