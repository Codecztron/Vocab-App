// App.js
import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import "./App.css";
import {
  FaInstagram,
  FaGithub,
  FaEnvelope,
  FaCoffee,
  FaDonate,
} from "react-icons/fa";

function App() {
  const [vocabList, setVocabList] = useState([]);
  const [savedVocabs, setSavedVocabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [csvLoaded, setCsvLoaded] = useState(false);
  const [quizVocabs, setQuizVocabs] = useState([]); // new state for quiz vocabs
  const [questionsRemaining, setQuestionsRemaining] = useState(0); // new state for question count
  const [quizHistory, setQuizHistory] = useState([]); // new state for quiz history
  const [showReview, setShowReview] = useState(false); // State to toggle review visibility
  const [selectedReviewQuestionIndex, setSelectedReviewQuestionIndex] =
    useState(null); // State for selected question index in review

  // Load CSV file
  useEffect(() => {
    // Try to load the CSV file
    fetch("/data.csv")
      .then((response) => {
        if (!response.ok) {
          throw new Error("CSV file not found");
        }
        return response.text();
      })
      .then((csvText) => {
        parseCSV(csvText);
        setCsvLoaded(true);
      })
      .catch((error) => {
        console.error("Error loading CSV:", error);
        setIsLoading(false);
      });

    // Load saved data from localStorage
    const saved = localStorage.getItem("learnedVocabs");
    if (saved) {
      setSavedVocabs(JSON.parse(saved));
    }
  }, []);

  // Parse CSV data
  const parseCSV = (csvText) => {
    Papa.parse(csvText, {
      delimiter: ";",
      complete: (results) => {
        // Skip header row
        const data = results.data
          .slice(1)
          .map((row, index) => {
            // Check if the row has enough columns
            if (row.length >= 2) {
              return {
                id: index,
                english: row[0],
                indonesian: row[1],
                learned: false,
                engAdditional1: null,
                indAdditional1: null,
                engAdditional2: null,
                indAdditional2: null,
              };
            }
            return null;
          })
          .filter((item) => item !== null); // Remove any null entries (invalid rows)

        // Load saved data and update learned status
        const saved = localStorage.getItem("learnedVocabs");
        if (saved) {
          const parsedSaved = JSON.parse(saved);

          setVocabList(
            data.map((vocab) => {
              return {
                ...vocab,
                learned: parsedSaved.includes(vocab.id),
              };
            }),
          );
        } else {
          setVocabList(data);
        }

        setIsLoading(false);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setIsLoading(false);
      },
    });
  };

  // Allow manual file upload if fetch fails
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        parseCSV(e.target.result);
        setCsvLoaded(true);
      };
      reader.readAsText(file);
    }
  };

  // Save learned vocabs to localStorage whenever it changes
  useEffect(() => {
    if (savedVocabs.length > 0) {
      localStorage.setItem("learnedVocabs", JSON.stringify(savedVocabs));
    }
  }, [savedVocabs]);

  // Toggle learned status
  const toggleLearned = (id) => {
    setVocabList(
      vocabList.map((vocab) =>
        vocab.id === id ? { ...vocab, learned: !vocab.learned } : vocab,
      ),
    );

    if (savedVocabs.includes(id)) {
      setSavedVocabs(savedVocabs.filter((vocabId) => vocabId !== id));
    } else {
      setSavedVocabs([...savedVocabs, id]);
    }
  };

  // Toggle all learned status
  const toggleAllLearned = () => {
    const allLearned = vocabList.every((vocab) => vocab.learned);
    const updatedVocabList = vocabList.map((vocab) => ({
      ...vocab,
      learned: !allLearned,
    }));
    setVocabList(updatedVocabList);

    const updatedSavedVocabs = updatedVocabList
      .filter((vocab) => vocab.learned)
      .map((vocab) => vocab.id);
    setSavedVocabs(updatedSavedVocabs);
  };

  // Untoggle all learned status
  const untoggleAllLearned = () => {
    const updatedVocabList = vocabList.map((vocab) => ({
      ...vocab,
      learned: false,
    }));
    setVocabList(updatedVocabList);
    setSavedVocabs([]);
  };

  // Start quiz
  const startQuiz = () => {
    const learnedVocabs = vocabList.filter((vocab) => vocab.learned);

    if (learnedVocabs.length < 4) {
      alert(
        'Anda perlu menandai minimal 4 kosakata sebagai "sudah dihafal" untuk memulai quiz!',
      );
      return;
    }

    setQuizVocabs([...learnedVocabs]); // Initialize quizVocabs with learned vocabs
    setQuestionsRemaining(learnedVocabs.length); // Initialize questionsRemaining
    setScore(0);
    setTotalQuestions(0);
    setQuizHistory([]); // Initialize quiz history
    setShowReview(false); // Reset showReview to false
    generateQuestion(); // Call generateQuestion without passing vocabs, it will use quizVocabs
    setActiveTab("quiz");
  };

  // Restart Quiz
  const restartQuiz = () => {
    setQuestionsRemaining(quizVocabs.length); // Reset questionsRemaining to initial quiz length
    setScore(0);
    setTotalQuestions(0);
    setQuizHistory([]); // Reset quiz history
    setShowReview(false); // Reset showReview to false
    generateQuestion();
  };

  // Generate a new question
  const generateQuestion = () => {
    if (quizVocabs.length === 0 || questionsRemaining <= 0) {
      setCurrentQuestion(null); // Set currentQuestion to null when no more questions
      return;
    }

    const vocabsToUse = quizVocabs;

    if (vocabsToUse.length === 0) {
      // This check is probably redundant now.
      alert(
        'Anda perlu menandai minimal 4 kosakata sebagai "sudah dihafal" untuk melanjutkan quiz!',
      );
      setActiveTab("list");
      return;
    }

    // Select random vocab for the question
    const randomIndex = Math.floor(Math.random() * vocabsToUse.length);
    const question = vocabsToUse[randomIndex];

    // Create options (including the correct answer)
    let optionVocabs = [question];

    // Add 3 random incorrect options
    const availableVocabs = vocabList
      .filter((v) => v.learned)
      .filter(
        // Make sure incorrect options also from learned words.
        (v) => v.id !== question.id,
      );

    for (let i = 0; i < 3; i++) {
      if (availableVocabs.length === 0) break;

      const randIndex = Math.floor(Math.random() * availableVocabs.length);
      optionVocabs.push(availableVocabs[randIndex]);
      availableVocabs.splice(randIndex, 1);
    }

    // Shuffle options
    optionVocabs = optionVocabs.sort(() => Math.random() - 0.5);

    setCurrentQuestion(question);
    setOptions(optionVocabs);
    setSelectedOption(null);
    setShowResult(false);
  };

  // Handle answer selection
  const handleSelectOption = (option) => {
    if (showResult) return;

    setSelectedOption(option);
    setIsCorrect(option.id === currentQuestion.id);
    setShowResult(true);

    if (option.id === currentQuestion.id) {
      setScore(score + 1);
    }

    setTotalQuestions(totalQuestions + 1);

    // Add question and user's answer to quiz history
    setQuizHistory((prevHistory) => [
      ...prevHistory,
      {
        question: currentQuestion,
        options: options,
        correctAnswer: currentQuestion,
        userAnswer: option,
        isCorrect: option.id === currentQuestion.id,
      },
    ]);
    setQuizVocabs(
      quizVocabs.filter((vocab) => vocab.id !== currentQuestion.id),
    ); // Remove the asked question from quizVocabs
    setQuestionsRemaining(questionsRemaining - 1); // Decrement question count
  };

  // Go to next question
  const handleNextQuestion = () => {
    if (questionsRemaining > 0) {
      generateQuestion();
    } else {
      setCurrentQuestion(null); // Ensure currentQuestion is null when quiz is finished
      setShowResult(false); // Reset showResult state
    }
  };

  const toggleReview = () => {
    setShowReview(!showReview);
  };

  const handleMinimapClick = (index) => {
    setSelectedReviewQuestionIndex(index);
  };

  const closeReviewPopup = () => {
    setSelectedReviewQuestionIndex(null);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-message">Loading...</div>

        {!csvLoaded && (
          <div className="upload-container">
            <p>File data.csv tidak ditemukan. Silakan upload file CSV Anda:</p>
            <label htmlFor="csv-upload" className="upload-button">
              <div className="upload-box">
                <span>Upload CSV File</span>
              </div>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden-input"
              />
            </label>
            <p className="format-hint">Format: Inggris;Indonesia</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-content">
        <h1 className="app-title">Vocab Quiz App</h1>

        <div className="tabs">
          <div className="tab-list">
            <button
              className={`tab-button ${activeTab === "list" ? "active" : ""}`}
              onClick={() => setActiveTab("list")}
            >
              Daftar Kosakata
            </button>
            <button
              className={`tab-button ${activeTab === "quiz" ? "active" : ""}`}
              onClick={() => setActiveTab("quiz")}
            >
              Quiz
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "list" && (
              <div className="vocab-list-tab">
                <div className="vocab-list-header">
                  <h2>Daftar Kosakata ({vocabList.length})</h2>
                  <div className="vocab-list-actions">
                    <span>
                      Sudah dihafal: {vocabList.filter((v) => v.learned).length}
                    </span>
                    <button
                      onClick={toggleAllLearned}
                      className="secondary-button"
                    >
                      Tandai Semua Status
                    </button>
                    <button onClick={startQuiz} className="primary-button">
                      Mulai Quiz
                    </button>
                  </div>
                </div>

                <div className="vocab-table-container">
                  <table className="vocab-table">
                    <thead>
                      <tr>
                        <th>Inggris</th>
                        <th>Indonesia</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vocabList.map((vocab) => (
                        <tr
                          key={vocab.id}
                          className={vocab.learned ? "learned-row" : ""}
                        >
                          <td className="vocab-english">{vocab.english}</td>
                          <td>{vocab.indonesian}</td>
                          <td className="vocab-status">
                            <label className="checkbox-container">
                              <input
                                type="checkbox"
                                checked={vocab.learned}
                                onChange={() => toggleLearned(vocab.id)}
                              />
                              <span className="checkmark"></span>
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "quiz" && (
              <div className="quiz-tab">
                {currentQuestion ? (
                  <div className="quiz-card">
                    <div className="quiz-question">
                      <h3>Terjemahkan ke Bahasa Indonesia:</h3>
                      <p className="quiz-word">{currentQuestion.english}</p>
                    </div>

                    <div className="quiz-options">
                      {options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleSelectOption(option)}
                          className={`quiz-option ${
                            selectedOption?.id === option.id
                              ? isCorrect
                                ? "correct-answer"
                                : "wrong-answer"
                              : showResult && option.id === currentQuestion.id
                                ? "correct-answer"
                                : ""
                          }`}
                          disabled={showResult}
                        >
                          {option.indonesian}
                          {showResult && option.id === currentQuestion.id && (
                            <span className="answer-icon correct">✓</span>
                          )}
                          {showResult &&
                            selectedOption?.id === option.id &&
                            !isCorrect && (
                              <span className="answer-icon wrong">✗</span>
                            )}
                        </button>
                      ))}
                    </div>

                    {showResult && (
                      <div className="quiz-result">
                        <button
                          onClick={handleNextQuestion}
                          className="primary-button"
                        >
                          Soal Berikutnya
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="quiz-welcome">
                    {totalQuestions > 0 && questionsRemaining === 0 ? ( // Quiz completed message and score
                      <div>
                        <h3>Quiz Selesai!</h3>
                        {!showReview ? (
                          <div>
                            <div className="quiz-score">
                              <h4>Hasil Akhir Quiz</h4>
                              <p className="score-value">
                                {score} / {totalQuestions} Benar
                              </p>
                              <p className="score-percentage">
                                ({Math.round((score / totalQuestions) * 100)}%)
                              </p>
                            </div>
                            <div className="quiz-actions">
                              {/* Button container */}
                              <button
                                onClick={toggleReview}
                                className="secondary-button"
                              >
                                Lihat Review Soal
                              </button>
                              <button
                                onClick={restartQuiz}
                                className="primary-button"
                              >
                                Mulai Ulang Quiz
                              </button>
                              <button
                                onClick={() => setActiveTab("list")}
                                className="secondary-button"
                              >
                                Kembali ke Daftar Kosakata
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="quiz-review">
                            <h4>Review Soal</h4>
                            <div className="review-minimap">
                              {quizHistory.map((historyItem, index) => (
                                <button
                                  key={index}
                                  className={`minimap-button ${selectedReviewQuestionIndex === index ? "active" : ""} ${historyItem.isCorrect ? "correct" : "wrong"}`}
                                  onClick={() => handleMinimapClick(index)}
                                >
                                  {index + 1}
                                </button>
                              ))}
                            </div>
                            {selectedReviewQuestionIndex !== null && (
                              <div className="review-popup">
                                <button
                                  className="popup-close-button"
                                  onClick={closeReviewPopup}
                                >
                                  X
                                </button>
                                {(() => {
                                  const historyItem =
                                    quizHistory[selectedReviewQuestionIndex];
                                  return (
                                    <div className="review-item">
                                      <p className="review-question">
                                        <strong>
                                          Soal {selectedReviewQuestionIndex + 1}
                                          :
                                        </strong>{" "}
                                        {historyItem.question.english}
                                      </p>
                                      <ul className="review-options-list">
                                        {historyItem.options.map((option) => (
                                          <li
                                            key={option.id}
                                            className={`review-option ${
                                              option.id ===
                                              historyItem.correctAnswer.id
                                                ? "correct-answer"
                                                : option.id ===
                                                      historyItem.userAnswer
                                                        .id &&
                                                    !historyItem.isCorrect
                                                  ? "wrong-answer"
                                                  : ""
                                            }`}
                                          >
                                            {option.indonesian}
                                            {option.id ===
                                              historyItem.correctAnswer.id && (
                                              <span className="answer-icon correct">
                                                ✓ (Benar)
                                              </span>
                                            )}
                                            {option.id ===
                                              historyItem.userAnswer.id &&
                                              !historyItem.isCorrect && (
                                                <span className="answer-icon wrong">
                                                  ✗ (Salah)
                                                </span>
                                              )}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            <div className="quiz-actions">
                              <button
                                onClick={toggleReview}
                                className="secondary-button"
                              >
                                Kembali ke Hasil Quiz
                              </button>
                              <button
                                onClick={() => setActiveTab("list")}
                                className="primary-button"
                              >
                                Kembali ke Daftar Kosakata
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Welcome message before quiz start
                      <div>
                        <h3>Selamat Datang di Quiz Kosakata!</h3>
                        <p>
                          Anda telah menandai{" "}
                          {vocabList.filter((v) => v.learned).length} kosakata
                          sebagai "sudah dihafal". Minimal dibutuhkan 4 kosakata
                          untuk memulai quiz.
                        </p>
                        <button
                          onClick={startQuiz}
                          className="primary-button large"
                        >
                          Mulai Quiz
                        </button>
                        <div className="quiz-actions">
                          {/* Button container here as well for consistent layout */}
                          <button
                            onClick={() => setActiveTab("list")}
                            className="secondary-button"
                          >
                            Kembali ke Daftar Kosakata
                          </button>
                        </div>

                        {totalQuestions > 0 &&
                          questionsRemaining !== 0 && ( // Last score during quiz (before completion)
                            <div className="quiz-score">
                              <h4>Hasil Quiz Terakhir</h4>
                              <p className="score-value">
                                {score} / {totalQuestions} Benar
                              </p>
                              <p className="score-percentage">
                                ({Math.round((score / totalQuestions) * 100)}%)
                              </p>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <footer className="app-footer">
          <p>
            Developed with <FaCoffee /> by Andri
          </p>
          <div className="footer-links">
            <a
              href="[Instagram Link]"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </a>
            <a href="[GitHub Link]" target="_blank" rel="noopener noreferrer">
              <FaGithub />
            </a>
            <a href="mailto:[Your Email]">
              <FaEnvelope />
            </a>
            <a href="[Saweria Link]" target="_blank" rel="noopener noreferrer">
              {" "}
              <FaDonate />
            </a>
          </div>
          <p>
            © {new Date().getFullYear()} Vocab Quiz App. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
