// server/controllers/vocabController.js
const Vocab = require("../models/Vocab");
const { translateText } = require("../utils/translate");
const { validationResult } = require("express-validator");

// Get all vocab
const getAllVocab = async (req, res, next) => {
  try {
    // Fetch vocab based on the user's role
    let vocab;
    if (req.user.role === "admin" || req.user.role === "dev") {
      vocab = await Vocab.find({}).sort({ createdAt: -1 }); // Get all vocab for admin/dev
    } else {
      vocab = await Vocab.find({ userId: req.user.userId }).sort({
        createdAt: -1,
      }); // Get user's vocab
    }
    res.status(200).json(vocab);
  } catch (err) {
    next(err);
  }
};

// Add vocab
const addVocab = async (req, res, next) => {
  try {
    const { word, definition } = req.body;

    if (!word || !definition) {
      return res
        .status(400)
        .json({ message: "Word and definition are required" });
    }

    const newVocab = new Vocab({
      word,
      definition,
      userId: req.user.userId, // Use userId from token
    });

    const savedVocab = await newVocab.save();
    res
      .status(201)
      .json({ message: "Vocab added successfully", vocab: savedVocab });
  } catch (err) {
    next(err);
  }
};

// Translate vocab - Updated
const translateVocab = async (req, res, next) => {
  try {
    const { text } = req.body;
    const translatedText = await translateText(text); // Removed source and target language as they're now handled in translateText
    res.status(200).json({ translatedText });
  } catch (err) {
    next(err);
  }
};

// Save translation to Vocab
const saveTranslationToVocab = async (req, res, next) => {
  try {
    const { vocabId, translation } = req.body;
    const vocab = await Vocab.findById(vocabId);

    if (!vocab) {
      return res.status(404).json({ message: "Vocab not found" });
    }

    vocab.translation = translation;
    await vocab.save();

    res.status(200).json({ message: "Translation saved successfully", vocab });
  } catch (err) {
    next(err);
  }
};

// Get Quiz
const getQuiz = async (req, res, next) => {
  try {
    const vocab = await Vocab.find({ userId: req.user.userId });
    if (!vocab || vocab.length === 0) {
      return res.status(404).json({ message: "No vocab found for this user" });
    }

    const quizQuestions = vocab.map((item) => ({
      question: item.word,
      options: [
        item.definition,
        ...vocab
          .filter((v) => v._id.toString() !== item._id.toString())
          .map((v) => v.definition)
          .slice(0, 2),
      ],
      answer: item.definition,
    }));

    quizQuestions.forEach((question) => {
      question.options = shuffleArray(question.options);
    });

    res.status(200).json({ questions: quizQuestions });
  } catch (err) {
    next(err);
  }
};

// Search Vocab - New Function
const searchVocab = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Use $text operator for full-text search (using compound index)
    const results = await Vocab.find({
      $text: { $search: query },
      userId:
        req.user.role === "admin" || req.user.role === "dev"
          ? { $exists: true }
          : req.user.userId, // Filter by user
    }).limit(10);

    res.status(200).json(results);
  } catch (err) {
    next(err);
  }
};

// Helper function to shuffle an array (Fisher-Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

module.exports = {
  getAllVocab,
  addVocab,
  translateVocab,
  getQuiz,
  saveTranslationToVocab,
  searchVocab,
};
