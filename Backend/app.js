// server/app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const vocabRoutes = require("./routes/vocabRoutes");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors()); // Enable CORS for all origins (for development)
app.use(express.json());

// Database Connection
connectDB();

// Routes
app.use("/api/auth", authRoutes); // <-- Periksa di sini
app.use("/api/vocab", vocabRoutes); // <-- Periksa di sini

// Error handling middleware (MUST be after routes)
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
