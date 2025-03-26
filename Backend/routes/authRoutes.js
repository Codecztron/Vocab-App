// server/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { login } = require("../controllers/authController"); // Impor controller login

router.post("/login", login); // Definisikan route untuk login

module.exports = router;
