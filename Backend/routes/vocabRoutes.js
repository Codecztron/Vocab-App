// server/routes/vocabRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllVocab,
  addVocab,
  translateVocab,
  getQuiz,
  saveTranslationToVocab,
  searchVocab,
} = require("../controllers/vocabController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect); // Protect all routes
router.get("/", getAllVocab); // Get all vocab (protected)
router.post("/", authorize(["dev", "admin", "user"]), addVocab); // Add vocab (dev/admin/user)
router.post("/translate", translateVocab); // Translate vocab (protected)
router.post(
  "/save-translation",
  authorize(["dev", "admin", "user"]),
  saveTranslationToVocab,
); // Save translation (dev/admin/user)
router.get("/quiz", getQuiz); // Get quiz questions (protected)
router.get("/search", searchVocab); // Search vocab (protected)

module.exports = router;
