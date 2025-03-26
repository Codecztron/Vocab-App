// server/config/db.js
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    // Construct the database name based on the environment
    const dbName =
      process.env.NODE_ENV === "production"
        ? "learning_vocab_prod"
        : "learning_vocab_dev"; // Or create a separate one for users
    const mongoURI = `${process.env.MONGODB_URL}${dbName}`; // Use base URL + dbName

    await mongoose.connect(mongoURI, {
      // useNewUrlParser: true, // Deprecated
      // useUnifiedTopology: true, // Deprecated
    });
    console.log(`MongoDB Connected to ${dbName}`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
