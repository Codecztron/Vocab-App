// App.js
import React, { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import DeveloperInfo from "./components/pages/dev.js";
import "./App.css"; // Assuming App.css contains styles for .custom-alert, .custom-alert-content, .custom-alert-close-button

// Simple Custom Alert Component (can be moved to its own file later)
function CustomAlert({ message, type = "info", onClose }) {
  if (!message) return null;

  return (
    <div className={`custom-alert-overlay ${type}`}>
      <div className="custom-alert-content">
        <p>{message}</p>
        <button onClick={onClose} className="custom-alert-close-button">
          OK
        </button>
      </div>
    </div>
  );
}

// VocabInputFields Component (moved to a separate component)
function VocabInputFields({ vocabList, setVocabList }) {
  const [newVocabs, setNewVocabs] = useState([{ english: "", indonesian: "" }]);

  const handleInputChange = (index, field, value) => {
    setNewVocabs((prevVocabs) => {
      const updatedVocabs = [...prevVocabs];
      updatedVocabs[index][field] = value;
      return updatedVocabs;
    });
  };

  const handleAddVocabField = () => {
    setNewVocabs((prevVocabs) => [
      ...prevVocabs,
      { english: "", indonesian: "" },
    ]);
  };

  const handleRemoveVocabField = (index) => {
    setNewVocabs((prevVocabs) => {
      const updatedVocabs = [...prevVocabs];
      updatedVocabs.splice(index, 1);
      return updatedVocabs;
    });
  };

  const handleSaveVocabs = () => {
    const validVocabs = newVocabs.filter(
      (vocab) => vocab.english.trim() && vocab.indonesian.trim(),
    );

    if (validVocabs.length === 0) {
      return;
    }

    const newVocabItems = validVocabs.map((vocab, index) => ({
      id: vocabList.length + index,
      english: vocab.english.trim(),
      indonesian: vocab.indonesian.trim(),
      learned: false,
    }));

    setVocabList((prevVocabList) => [...prevVocabList, ...newVocabItems]);
    setNewVocabs([{ english: "", indonesian: "" }]);
  };

  return (
    <div>
      {newVocabs.map((vocab, index) => (
        <div key={index} className="vocab-input-group">
          <input
            type="text"
            placeholder="English"
            value={vocab.english}
            onChange={(e) =>
              handleInputChange(index, "english", e.target.value)
            }
          />
          <input
            type="text"
            placeholder="Indonesia"
            value={vocab.indonesian}
            onChange={(e) =>
              handleInputChange(index, "indonesian", e.target.value)
            }
          />
          {newVocabs.length > 1 && (
            <button
              type="button"
              onClick={() => handleRemoveVocabField(index)}
              className="remove-vocab-button"
            >
              -
            </button>
          )}
        </div>
      ))}
      <div className="vocab-input-actions">
        <button
          type="button"
          onClick={handleAddVocabField}
          className="add-vocab-button"
        >
          + Tambah Kosakata
        </button>
        <button
          type="button"
          onClick={handleSaveVocabs}
          className="primary-button save-vocab-button"
        >
          Simpan Kosakata
        </button>
      </div>
    </div>
  );
}

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
  const [quizVocabs, setQuizVocabs] = useState([]);
  const [questionsRemaining, setQuestionsRemaining] = useState(0);
  const [quizHistory, setQuizHistory] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [selectedReviewQuestionIndex, setSelectedReviewQuestionIndex] =
    useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State untuk status login
  const [username, setUsername] = useState(""); // State untuk input username
  const [password, setPassword] = useState(""); // State untuk input password
  const [loginError, setLoginError] = useState(null); // State untuk pesan error login
  const [customAlert, setCustomAlert] = useState({
    show: false,
    message: "",
    type: "info",
  }); // State for custom alert

  // Function to show custom alert
  const showAlert = (message, type = "info") => {
    setCustomAlert({ show: true, message, type });
  };

  // Function to close custom alert
  const closeAlert = () => {
    setCustomAlert({ show: false, message: "", type: "info" });
  };

  // Parse CSV data
  const parseCSV = useCallback((csvText) => {
    Papa.parse(csvText, {
      delimiter: ";",
      complete: (results) => {
        const data = results.data
          .slice(1) // Skip header row
          .map((row, index) => {
            // Basic validation: ensure row is an array and has at least 2 non-empty strings
            if (
              Array.isArray(row) &&
              row.length >= 2 &&
              row[0]?.trim() &&
              row[1]?.trim()
            ) {
              return {
                id: index, // Use index as a simple unique ID
                english: row[0].trim(),
                indonesian: row[1].trim(),
                learned: false, // Default to not learned
                // Add potential extra fields (optional chaining and nullish coalescing)
                engAdditional1: row[2]?.trim() || null,
                indAdditional1: row[3]?.trim() || null,
                engAdditional2: row[4]?.trim() || null,
                indAdditional2: row[5]?.trim() || null,
              };
            }
            console.warn(`Skipping invalid row at index ${index + 1}:`, row);
            return null; // Return null for invalid rows
          })
          .filter((item) => item !== null); // Filter out null items

        if (data.length === 0 && results.data.length > 1) {
          showAlert(
            "Format CSV tidak sesuai atau kosong. Pastikan formatnya 'Inggris;Indonesia' dan ada datanya.",
            "error",
          );
        } else if (data.length === 0) {
          showAlert(
            "File CSV kosong atau tidak ada data yang valid.",
            "warning",
          );
        }

        // Retrieve saved vocabs again AFTER parsing to apply learned status
        const saved = localStorage.getItem("learnedVocabs");
        let initialVocabList = data;
        // let loadedSavedVocabIds = []; // This variable was unused, so it's removed.

        if (saved) {
          try {
            const parsedSaved = JSON.parse(saved);
            if (Array.isArray(parsedSaved)) {
              // loadedSavedVocabIds = parsedSaved; // This was commented out.  Removed as well
              initialVocabList = data.map((vocab) => ({
                ...vocab,
                // Ensure ID types match if necessary (assuming vocab.id is number, saved IDs are numbers)
                learned: parsedSaved.includes(vocab.id),
              }));
            } else {
              console.warn(
                "Invalid data found in localStorage for learnedVocabs. Resetting.",
              );
              localStorage.removeItem("learnedVocabs"); // Clear invalid data
            }
          } catch (e) {
            console.error("Error parsing learnedVocabs from localStorage:", e);
            localStorage.removeItem("learnedVocabs"); // Clear corrupted data
          }
        }

        setVocabList(initialVocabList);

        // Ensure savedVocabs state is synchronized based on the actual `learned` status derived from localStorage
        const currentLearnedIds = initialVocabList
          .filter((v) => v.learned)
          .map((v) => v.id);
        setSavedVocabs(currentLearnedIds);

        setIsLoading(false); // Parsing complete, stop loading indicator
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        showAlert(`Gagal memproses file CSV: ${error.message}`, "error");
        setIsLoading(false); // Stop loading indicator on parse error
      },
      skipEmptyLines: true, // Skip empty lines during parsing
    });
  }, []);

  // Load CSV file dan data lainnya HANYA jika sudah login
  useEffect(() => {
    // Check if the user is already logged in from local storage
    const storedUsername = localStorage.getItem("username");
    const storedIsLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const storedVocabList = localStorage.getItem("vocabList");
    const storedSavedVocabs = localStorage.getItem("savedVocabs");
    const storedCsvLoaded = localStorage.getItem("csvLoaded") === "true";
    const storedActiveTab = localStorage.getItem("activeTab") || "list";

    if (storedIsLoggedIn && storedUsername) {
      setUsername(storedUsername);
      setIsLoggedIn(true);
    }

    if (storedVocabList) {
      try {
        setVocabList(JSON.parse(storedVocabList));
      } catch (error) {
        console.error("Error parsing vocabList from localStorage:", error);
        localStorage.removeItem("vocabList");
        setVocabList([]);
      }
    }

    if (storedSavedVocabs) {
      try {
        setSavedVocabs(JSON.parse(storedSavedVocabs));
      } catch (error) {
        console.error("Error parsing savedVocabs from localStorage:", error);
        localStorage.removeItem("savedVocabs");
        setSavedVocabs([]);
      }
    }

    if (storedCsvLoaded) {
      setCsvLoaded(storedCsvLoaded);
    }

    setActiveTab(storedActiveTab);

    if (isLoggedIn) {
      setIsLoading(true); // Set loading true when starting to load data
      // Load CSV file
      const loadData = async () => {
        try {
          const response = await fetch("/data.csv");
          if (!response.ok) {
            throw new Error("CSV file not found");
          }
          const csvText = await response.text();
          parseCSV(csvText);
          setCsvLoaded(true);
        } catch (error) {
          console.error("Error loading CSV:", error);
          setIsLoading(false);
        }
      };

      if (!vocabList.length || !csvLoaded) {
        loadData();
      } else {
        setIsLoading(false);
      }

      // Load saved data from localStorage
      const saved = localStorage.getItem("learnedVocabs");
      if (saved) {
        try {
          const parsedSaved = JSON.parse(saved);
          if (Array.isArray(parsedSaved)) {
            setSavedVocabs(parsedSaved);
          } else {
            console.warn(
              "Invalid data found in localStorage for learnedVocabs. Resetting.",
            );
            localStorage.removeItem("learnedVocabs");
            setSavedVocabs([]);
          }
        } catch (e) {
          console.error("Error parsing learnedVocabs from localStorage:", e);
          localStorage.removeItem("learnedVocabs");
          setSavedVocabs([]);
        }
      } else {
        setSavedVocabs([]); // Initialize as empty array if nothing is saved
      }
    } else {
      setIsLoading(false); // Don't show loading if not logged in
    }
  }, [isLoggedIn, parseCSV, vocabList.length, csvLoaded]); // Effect depends on isLoggedIn, parseCSV, vocabList.length, and csvLoaded

  // Handle manual file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsLoading(true); // Show loading while parsing uploaded file
      const reader = new FileReader();
      reader.onload = (e) => {
        parseCSV(e.target.result);
        setCsvLoaded(true); // Mark as loaded after successful parse attempt
      };
      reader.onerror = (e) => {
        console.error("Error reading file:", e);
        showAlert("Gagal membaca file yang diunggah.", "error");
        setIsLoading(false); // Stop loading on read error
      };
      reader.readAsText(file);
    }
  };

  // Save learned vocabs to localStorage whenever savedVocabs changes
  useEffect(() => {
    if (isLoggedIn && vocabList.length > 0) {
      try {
        localStorage.setItem("learnedVocabs", JSON.stringify(savedVocabs));
      } catch (e) {
        console.error("Error saving learnedVocabs to localStorage:", e);
        showAlert(
          "Gagal menyimpan progres Anda. Penyimpanan lokal mungkin penuh atau rusak.",
          "error",
        );
      }
    }
  }, [savedVocabs, isLoggedIn, vocabList.length]);

  useEffect(() => {
    if (isLoggedIn) {
      try {
        localStorage.setItem("vocabList", JSON.stringify(vocabList));
        localStorage.setItem("savedVocabs", JSON.stringify(savedVocabs));
        localStorage.setItem("csvLoaded", csvLoaded);
        localStorage.setItem("activeTab", activeTab);
      } catch (error) {
        console.error("Error saving data to localStorage:", error);
        showAlert(
          "Gagal menyimpan data. Penyimpanan lokal mungkin penuh atau rusak.",
          "error",
        );
      }
    }
  }, [vocabList, savedVocabs, csvLoaded, activeTab, isLoggedIn]);

  // Toggle learned status for a single vocabulary item
  const toggleLearned = (id) => {
    setVocabList((prevVocabList) =>
      prevVocabList.map((vocab) =>
        vocab.id === id ? { ...vocab, learned: !vocab.learned } : vocab,
      ),
    );
    setSavedVocabs((prevSavedVocabs) => {
      const isLearned = vocabList.find((vocab) => vocab.id === id)?.learned;
      if (isLearned) {
        return prevSavedVocabs.filter((vocabId) => vocabId !== id);
      }
      return prevSavedVocabs.includes(id)
        ? prevSavedVocabs
        : [...prevSavedVocabs, id];
    });
  };

  // Toggle learned status for all vocabulary items
  const toggleAllLearned = () => {
    const allCurrentlyLearned = vocabList.every((vocab) => vocab.learned);
    const targetLearnedStatus = !allCurrentlyLearned;

    setVocabList((prevVocabList) =>
      prevVocabList.map((vocab) => ({
        ...vocab,
        learned: targetLearnedStatus,
      })),
    );

    setSavedVocabs(
      targetLearnedStatus ? vocabList.map((vocab) => vocab.id) : [],
    );
  };

  // Start quiz
  const startQuiz = () => {
    const learnedVocabs = vocabList.filter((vocab) => vocab.learned);

    if (learnedVocabs.length < 4) {
      showAlert(
        'Anda perlu menandai minimal 4 kosakata sebagai "sudah dihafal" untuk memulai quiz!',
        "warning",
      );
      return;
    }

    const shuffledLearnedVocabs = [...learnedVocabs].sort(
      () => Math.random() - 0.5,
    );

    setQuizVocabs(shuffledLearnedVocabs);
    setQuestionsRemaining(shuffledLearnedVocabs.length);
    setScore(0);
    setTotalQuestions(0);
    setQuizHistory([]);
    setShowResult(false);
    setSelectedOption(null);
    setIsCorrect(false);
    setShowReview(false);
    setSelectedReviewQuestionIndex(null);

    generateQuestion(shuffledLearnedVocabs);
    setActiveTab("quiz");
  };

  // Restart Quiz
  const restartQuiz = () => {
    const learnedVocabs = vocabList.filter((vocab) => vocab.learned);

    if (learnedVocabs.length < 4) {
      showAlert(
        'Tidak cukup kosakata yang ditandai "sudah dihafal" (minimal 4) untuk memulai ulang quiz.',
        "warning",
      );
      return;
    }
    const shuffledLearnedVocabs = [...learnedVocabs].sort(
      () => Math.random() - 0.5,
    );

    setQuizVocabs(shuffledLearnedVocabs);
    setQuestionsRemaining(shuffledLearnedVocabs.length);
    setScore(0);
    setTotalQuestions(0);
    setQuizHistory([]);
    setShowResult(false);
    setSelectedOption(null);
    setIsCorrect(false);
    setShowReview(false);
    setSelectedReviewQuestionIndex(null);

    generateQuestion(shuffledLearnedVocabs);
  };

  // Generate a new question
  const generateQuestion = (currentQuizVocabList = quizVocabs) => {
    if (questionsRemaining <= 0) {
      setCurrentQuestion(null);
      setShowResult(false);
      setSelectedOption(null);
      return;
    }

    const vocabsToUse = currentQuizVocabList;

    if (vocabsToUse.length === 0) {
      console.error(
        "Generate question called with empty vocabs list, but questionsRemaining > 0. Resetting quiz state.",
      );
      setCurrentQuestion(null);
      setQuestionsRemaining(0);
      return;
    }

    const question = vocabsToUse[0];

    let optionVocabs = [question];

    const learnedDistractors = vocabList.filter(
      (v) => v.learned && v.id !== question.id,
    );
    const unlearnedVocabs = vocabList.filter(
      (v) => !v.learned && v.id !== question.id,
    );

    const shuffledLearnedDistractors = [...learnedDistractors].sort(
      () => Math.random() - 0.5,
    );
    const shuffledUnlearned = [...unlearnedVocabs].sort(
      () => Math.random() - 0.5,
    );

    let addedDistractors = 0;
    for (
      let i = 0;
      i < shuffledLearnedDistractors.length && addedDistractors < 3;
      i++
    ) {
      optionVocabs.push(shuffledLearnedDistractors[i]);
      addedDistractors++;
    }
    for (let i = 0; i < shuffledUnlearned.length && addedDistractors < 3; i++) {
      optionVocabs.push(shuffledUnlearned[i]);
      addedDistractors++;
    }

    let fallbackAttempts = 0;
    while (
      optionVocabs.length < 4 &&
      vocabList.length > 1 &&
      fallbackAttempts < 10
    ) {
      let fallbackIndex = Math.floor(Math.random() * vocabList.length);
      let fallbackVocab = vocabList[fallbackIndex];
      if (
        fallbackVocab.id !== question.id &&
        !optionVocabs.some((opt) => opt.id === fallbackVocab.id)
      ) {
        optionVocabs.push(fallbackVocab);
      }
      fallbackAttempts++;
    }

    const shuffledOptions = optionVocabs.sort(() => Math.random() - 0.5);

    setCurrentQuestion(question);
    setOptions(shuffledOptions);
    setSelectedOption(null);
    setShowResult(false);
    setIsCorrect(false);
  };

  // Handle answer selection
  const handleSelectOption = (option) => {
    if (showResult || !currentQuestion) return;

    const correct = option.id === currentQuestion.id;
    setSelectedOption(option);
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore((prevScore) => prevScore + 1);
    }

    setQuizHistory((prevHistory) => [
      ...prevHistory,
      {
        question: currentQuestion,
        options: options,
        correctAnswer: currentQuestion,
        userAnswer: option,
        isCorrect: correct,
      },
    ]);

    setQuestionsRemaining((prevRemaining) => prevRemaining - 1);
    setQuizVocabs((prevQuizVocabs) => prevQuizVocabs.slice(1));
  };

  // Go to next question OR finish quiz
  const handleNextQuestion = () => {
    setTotalQuestions((prevTotal) => prevTotal + 1);

    if (questionsRemaining > 0) {
      generateQuestion();
    } else {
      setCurrentQuestion(null);
      setShowResult(false);
      setSelectedOption(null);
    }
  };

  // Toggle visibility of the quiz review section
  const toggleReview = () => {
    setShowReview(!showReview);
    setSelectedReviewQuestionIndex(null);
  };

  // Handle clicking on a minimap button in review mode
  const handleMinimapClick = (index) => {
    setSelectedReviewQuestionIndex(index);
  };

  // Close the review details popup
  const closeReviewPopup = () => {
    setSelectedReviewQuestionIndex(null);
  };

  // Function to handle login attempt
  const handleLogin = (event) => {
    event.preventDefault();
    if (!username || !password) {
      setLoginError("Username dan password tidak boleh kosong.");
      return;
    }
    setLoginError(null);

    const expectedUsername = process.env.REACT_APP_VOCAB_APP_USER;
    const expectedPassword = process.env.REACT_APP_VOCAB_APP_PASSWORD;

    if (username === expectedUsername && password === expectedPassword) {
      setIsLoggedIn(true);
      localStorage.setItem("username", username); // Save username to local storage
      localStorage.setItem("isLoggedIn", "true"); // Save login status to local storage
    } else {
      setIsLoggedIn(false);
      setLoginError("Username atau password salah.");
      setPassword("");
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setVocabList([]);
    setSavedVocabs([]);
    setIsLoading(false);
    setActiveTab("list");
    setCurrentQuestion(null);
    setOptions([]);
    setSelectedOption(null);
    setShowResult(false);
    setIsCorrect(false);
    setScore(0);
    setTotalQuestions(0);
    setCsvLoaded(false);
    setQuizVocabs([]);
    setQuestionsRemaining(0);
    setQuizHistory([]);
    setShowReview(false);
    setSelectedReviewQuestionIndex(null);
    setUsername("");
    setPassword("");
    setLoginError(null);

    localStorage.removeItem("username"); // Remove username from local storage
    localStorage.removeItem("isLoggedIn"); // Remove login status from local storage
    localStorage.removeItem("vocabList");
    localStorage.removeItem("savedVocabs");
    localStorage.removeItem("csvLoaded");
    localStorage.removeItem("activeTab");
  };

  // Tambahkan fungsi ini ke dalam komponen Anda
  const getFilteredVocabList = () => {
    if (!searchTerm || searchTerm.trim() === "") {
      return vocabList;
    }

    return vocabList.filter(
      (vocab) =>
        vocab.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vocab.indonesian.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  // ---------- RENDER LOGIC ----------

  const HighlightText = ({ text, highlight }) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }

    const regex = new RegExp(
      `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <span key={i} className="highlight-match">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </span>
    );
  };
  // Loading state UI (only show if logged in and loading)
  if (isLoading && isLoggedIn) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-message">Memuat data...</div>
        {!csvLoaded && (
          <div className="upload-container fallback-upload">
            <p>
              Mencoba memuat <code>data.csv</code>...
            </p>
            <p>Jika gagal atau file tidak ada, unggah manual:</p>
            <label htmlFor="csv-upload-loading" className="upload-button">
              <div className="upload-box">
                <span>Upload CSV File</span>
              </div>
              <input
                id="csv-upload-loading" // Unique ID
                type="file"
                accept=".csv, text/csv"
                onChange={handleFileUpload}
                className="hidden-input"
              />
            </label>
            <p className="format-hint">Format: Inggris;Indonesia per baris</p>
          </div>
        )}
      </div>
    );
  }

  // Login Screen UI
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        {customAlert.show && (
          <CustomAlert
            message={customAlert.message}
            type={customAlert.type}
            onClose={closeAlert}
          />
        )}
        <div className="login-box card-style">
          <h2 className="login-title">Vocab App</h2>
          <p className="login-info">
            Hubungi{" "}
            <a
              href="https://www.instagram.com/andrksuma/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Developer
            </a>{" "}
            untuk mendapatkan akun.
          </p>
          {loginError && <p className="error-message">{loginError}</p>}
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input
                type="text"
                id="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="primary-button login-button">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main App UI (after login)
  return (
    <div className="app-container">
      {customAlert.show && (
        <CustomAlert
          message={customAlert.message}
          type={customAlert.type}
          onClose={closeAlert}
        />
      )}
      <div className="app-content">
        <div className="app-header">
          <h1 className="app-title">Vocab Quiz App</h1>
          {/* Consider adding user info/logout button here */}
          <div className="header-user-info">
            Welcome,<span>{username}!</span>
          </div>
          <div className="header-user-info">
            Bismillah UTBK <span>600+</span>
          </div>
        </div>
        {/* Manual Upload Section (shown only if logged in AND csv failed to load/parse) */}
        {!csvLoaded && isLoggedIn && !isLoading && (
          <div className="upload-container card-style manual-upload-section">
            <h3>Data Kosakata Belum Tersedia</h3>
            <p>
              File <code>data.csv</code> tidak ditemukan atau gagal dimuat.
              Silakan unggah file CSV Anda:
            </p>
            <label htmlFor="csv-upload-manual" className="upload-button">
              <div className="upload-box">
                <span>Upload CSV File</span>
              </div>
              <input
                id="csv-upload-manual" // Ensure unique ID
                type="file"
                accept=".csv, text/csv"
                onChange={handleFileUpload}
                className="hidden-input"
              />
            </label>
            <p className="format-hint">
              Format yang dibutuhkan: <code>Inggris;Indonesia</code> per baris.
            </p>
          </div>
        )}
        {/* Tabs Navigation & Content (Only show if CSV is loaded successfully) */}
        {csvLoaded && (
          <div className="tabs">
            <div className="tab-list">
              <button
                className={`tab-button ${activeTab === "list" ? "active" : ""}`}
                onClick={() => setActiveTab("list")}
              >
                Daftar Kosakata
              </button>
              <button
                className={`tab-button ${activeTab === "inputVocab" ? "active" : ""}`}
                onClick={() => setActiveTab("inputVocab")}
              >
                Input Kosakata
              </button>
              <button
                className={`tab-button ${activeTab === "quiz" ? "active" : ""}`}
                onClick={() => setActiveTab("quiz")}
                title="Lihat bagian Quiz"
              >
                Quiz
              </button>
              <button
                className={`tab-button ${activeTab === "akun" ? "active" : ""}`}
                onClick={() => setActiveTab("akun")}
              >
                Akun
              </button>
              <button
                className={`tab-button ${activeTab === "dev" ? "active" : ""}`}
                onClick={() => setActiveTab("dev")}
              >
                Developer
              </button>
            </div>
            {/* Tab Content */}
            <div className="tab-content">
              {/* Input Vocab Tab */}
              {activeTab === "inputVocab" && (
                <div className="input-vocab-tab card-style">
                  <h2>Input Kosakata Baru</h2>
                  <div className="input-form">
                    {/* State to hold multiple vocab entries */}
                    {/* Use state to manage individual input fields */}
                    {/* Define a state variable to hold the list of new vocab objects */}
                    {vocabList.length > 0 && (
                      <p className="vocab-list-length">
                        Total Kosakata: {vocabList.length}
                      </p>
                    )}

                    {/* Initialize an array to hold the vocab input fields */}
                    {/* State for the new vocabulary input fields */}
                    {/* Each entry in newVocabs will be an object with english and indonesian */}
                    <VocabInputFields
                      vocabList={vocabList}
                      setVocabList={setVocabList}
                    />
                  </div>
                </div>
              )}

              {/* Developer Tab */}
              {activeTab === "dev" && <DeveloperInfo />}

              {/* Akun Tab */}
              {activeTab === "akun" && (
                <div className="akun-tab card-style">
                  <h2>Informasi Akun</h2>
                  <p className="account-info-item">
                    <strong>Username:</strong> {username}
                  </p>
                  {/* Add more account details if needed */}
                  {/* <p className="account-info-item"><strong>Joined:</strong> [Date]</p> */}
                  <button
                    onClick={handleLogout}
                    className="logout-button secondary-button"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* Vocab List Tab */}
              {activeTab === "list" && (
                <div className="vocab-list-tab">
                  <div className="vocab-list-header card-style">
                    <h2>Daftar Kosakata ({vocabList.length})</h2>
                    <div className="vocab-list-actions">
                      <span className="learned-count">
                        Sudah dihafal: {savedVocabs.length} / {vocabList.length}
                      </span>
                      <div className="vocab-list-actions-container">
                        <button
                          onClick={toggleAllLearned}
                          className="secondary-button"
                          disabled={vocabList.length === 0}
                        >
                          {vocabList.length > 0 &&
                          savedVocabs.length === vocabList.length
                            ? "Batal Tandai Semua"
                            : "Tandai Semua"}
                        </button>
                        <button
                          onClick={startQuiz}
                          className="primary-button"
                          title={
                            savedVocabs.length < 4
                              ? "Tandai minimal 4 kata untuk memulai quiz"
                              : `Mulai quiz (${savedVocabs.length} kata)`
                          }
                        >
                          Mulai Quiz ({savedVocabs.length} Kata)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Modern Search Component */}
                  <div className="search-and-filter-container">
                    <div className="modern-search-container card-style">
                      <div className="search-icon">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M21 21L16.65 16.65"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className="modern-search-input"
                        placeholder="Cari kosakata Inggris atau Indonesia..."
                        value={searchTerm || ""}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                        }}
                      />
                      {searchTerm && (
                        <button
                          className="modern-clear-button"
                          onClick={() => {
                            setSearchTerm("");
                          }}
                          aria-label="Clear search"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M18 6L6 18"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M6 6L18 18"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Sorting Controls - Redesigned */}
                    <div className="modern-sort-controls card-style">
                      <label
                        htmlFor="sort-select"
                        className="modern-sort-label"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 6H20M4 12H14M4 18H8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Urutkan
                      </label>
                      <select
                        id="sort-select"
                        className="modern-sort-select"
                        onChange={(e) => {
                          const sortBy = e.target.value;
                          let sortedVocabList = [...vocabList];
                          switch (sortBy) {
                            case "english":
                              sortedVocabList = [...vocabList].sort((a, b) =>
                                a.english.localeCompare(b.english),
                              );
                              break;
                            case "englishZtoA":
                              sortedVocabList = [...vocabList].sort((a, b) =>
                                b.english.localeCompare(a.english),
                              );
                              break;
                            case "indonesian":
                              sortedVocabList = [...vocabList].sort((a, b) =>
                                a.indonesian.localeCompare(b.indonesian),
                              );
                              break;
                            case "indonesianZtoA":
                              sortedVocabList = [...vocabList].sort((a, b) =>
                                b.indonesian.localeCompare(a.indonesian),
                              );
                              break;
                            case "date":
                              sortedVocabList = [...vocabList].sort(
                                (a, b) => a.id - b.id,
                              );
                              break;
                            case "mostRecent":
                              sortedVocabList = [...vocabList].sort(
                                (a, b) => b.id - a.id,
                              );
                              break;
                            default:
                              break;
                          }
                          setVocabList(sortedVocabList);
                        }}
                      >
                        <option value="">Pilih Urutan</option>
                        <option value="mostRecent">Terbaru</option>
                        <option value="date">Tanggal Ditambahkan</option>
                        <option value="english">A - Z (Inggris)</option>
                        <option value="englishZtoA">Z - A (Inggris)</option>
                        <option value="indonesian">A - Z (Indonesia)</option>
                        <option value="indonesianZtoA">
                          Z - A (Indonesia)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Search Results Info */}
                  {searchTerm && (
                    <div className="search-results-info card-style">
                      <div className="results-count">
                        <span className="results-highlight">
                          {getFilteredVocabList().length}
                        </span>{" "}
                        dari {vocabList.length} kosakata ditemukan untuk "
                        <span className="search-term">{searchTerm}</span>"
                      </div>
                    </div>
                  )}

                  {getFilteredVocabList().length > 0 ? (
                    <div className="modern-vocab-table-container card-style">
                      <table className="modern-vocab-table">
                        <thead>
                          <tr>
                            <th className="col-english">Inggris</th>
                            <th className="col-indonesian">Indonesia</th>
                            <th className="col-status">Sudah Hafal?</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredVocabList().map((vocab) => (
                            <tr
                              key={vocab.id}
                              className={vocab.learned ? "learned-row" : ""}
                            >
                              <td className="vocab-english">
                                {searchTerm ? (
                                  <HighlightText
                                    text={vocab.english}
                                    highlight={searchTerm}
                                  />
                                ) : (
                                  vocab.english
                                )}
                              </td>
                              <td className="vocab-indonesian">
                                {searchTerm ? (
                                  <HighlightText
                                    text={vocab.indonesian}
                                    highlight={searchTerm}
                                  />
                                ) : (
                                  vocab.indonesian
                                )}
                              </td>
                              <td className="vocab-status">
                                <label
                                  className="modern-checkbox-container"
                                  title={
                                    vocab.learned
                                      ? "Tandai sebagai belum hafal"
                                      : "Tandai sebagai sudah hafal"
                                  }
                                >
                                  <input
                                    type="checkbox"
                                    checked={vocab.learned}
                                    onChange={() => toggleLearned(vocab.id)}
                                  />
                                  <span className="modern-checkmark">
                                    {vocab.learned && (
                                      <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M20 6L9 17L4 12"
                                          stroke="white"
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    )}
                                  </span>
                                </label>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="modern-empty-state card-style">
                      {searchTerm ? (
                        <>
                          <div className="empty-icon">
                            <svg
                              width="64"
                              height="64"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M10 10L14 14M14 10L10 14M19 19L14.65 14.65M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <p className="empty-title">
                            Tidak ada hasil ditemukan
                          </p>
                          <p className="empty-description">
                            Tidak ditemukan kosakata untuk "
                            <strong>{searchTerm}</strong>". Coba dengan kata
                            kunci lain atau periksa ejaan Anda.
                          </p>
                          <button
                            className="reset-search-button"
                            onClick={() => setSearchTerm("")}
                          >
                            Reset Pencarian
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="empty-icon">
                            <svg
                              width="64"
                              height="64"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <p className="empty-title">Daftar kosakata kosong</p>
                          <p className="empty-description">
                            Jika Anda baru saja mengunggah file, pastikan
                            formatnya benar ('Inggris;Indonesia') dan file tidak
                            kosong.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Quiz Tab */}
              {activeTab === "quiz" && (
                <div className="quiz-tab">
                  {/* Quiz Progress Indicator (only when a question is active) */}
                  {currentQuestion && (
                    <div className="quiz-progress card-style">
                      Pertanyaan: {totalQuestions + 1} /{" "}
                      {totalQuestions + questionsRemaining + 1} | Skor
                      Sementara: {score}
                    </div>
                  )}

                  {currentQuestion ? (
                    // --- Displaying Current Question ---
                    <div className="quiz-card card-style">
                      <div className="quiz-question">
                        <h3>Terjemahkan kata berikut ke Bahasa Indonesia:</h3>
                        <p className="quiz-word">{currentQuestion.english}</p>
                      </div>

                      <div className="quiz-options">
                        {options.map((option) => {
                          const isSelected = selectedOption?.id === option.id;
                          const isCorrectAnswer =
                            option.id === currentQuestion.id;
                          const buttonClasses = `quiz-option ${
                            isSelected
                              ? isCorrect
                                ? "correct-answer selected"
                                : "wrong-answer selected"
                              : ""
                          } ${showResult && !isSelected && isCorrectAnswer ? "correct-answer" : ""} ${showResult ? "disabled" : ""}`;
                          return (
                            <button
                              key={option.id}
                              onClick={() => handleSelectOption(option)}
                              className={buttonClasses}
                              disabled={showResult}
                            >
                              {option.indonesian}
                              {showResult && isCorrectAnswer && (
                                <span
                                  className={`answer-icon ${isSelected && isCorrect ? "selected-correct" : "correct"}`}
                                >
                                  {" "}
                                  ✓
                                </span>
                              )}
                              {showResult && isSelected && !isCorrect && (
                                <span className="answer-icon wrong"> ✗</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {showResult && (
                        <div className="quiz-result">
                          <button
                            onClick={handleNextQuestion}
                            className="primary-button next-question-button"
                          >
                            {questionsRemaining > 0
                              ? "Soal Berikutnya →"
                              : "Hasil Akhir"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    // --- Quiz Welcome / Results Screen ---
                    <div className="quiz-welcome card-style">
                      {totalQuestions > 0 && questionsRemaining === 0 ? (
                        // --- Quiz Completed View ---
                        <div>
                          <h3>🎉 Quiz Selesai! 🎉</h3>
                          {!showReview ? (
                            // --- Final Score View ---
                            <div>
                              <div className="quiz-score final-score">
                                <h4>Hasil Akhir Quiz</h4>
                                <p className="score-value">
                                  {score} / {totalQuestions} Benar
                                </p>
                                <p className="score-percentage">
                                  (
                                  {totalQuestions > 0
                                    ? Math.round((score / totalQuestions) * 100)
                                    : 0}
                                  %)
                                </p>
                              </div>
                              <div className="quiz-actions">
                                <button
                                  onClick={toggleReview}
                                  className="secondary-button"
                                  disabled={quizHistory.length === 0}
                                >
                                  Review Soal ({quizHistory.length})
                                </button>
                                <button
                                  onClick={restartQuiz}
                                  className="primary-button"
                                  title={
                                    savedVocabs.length < 4
                                      ? "Minimal 4 kata untuk mulai ulang"
                                      : "Mulai Ulang Quiz"
                                  }
                                >
                                  Mulai Ulang Quiz
                                </button>
                                <button
                                  onClick={() => setActiveTab("list")}
                                  className="secondary-button"
                                >
                                  Daftar Kosakata
                                </button>
                              </div>
                            </div>
                          ) : (
                            // --- Quiz Review View ---
                            <div className="quiz-review">
                              <div className="review-header">
                                <h4>Review Soal Quiz</h4>
                              </div>

                              <div className="review-minimap">
                                {quizHistory.map((historyItem, index) => (
                                  <button
                                    key={index}
                                    className={`minimap-button ${selectedReviewQuestionIndex === index ? "active" : ""} ${historyItem.isCorrect ? "correct" : "wrong"}`}
                                    onClick={() => handleMinimapClick(index)}
                                    title={`Soal ${index + 1} (${historyItem.isCorrect ? "Benar" : "Salah"})`}
                                  >
                                    {index + 1}
                                  </button>
                                ))}
                              </div>

                              {/* Review Popup/Details Area */}
                              {selectedReviewQuestionIndex !== null && (
                                <div className="review-details-container">
                                  <div className="review-popup card-style">
                                    <button
                                      className="popup-close-button"
                                      onClick={closeReviewPopup}
                                      title="Tutup detail soal"
                                    >
                                      &times;
                                    </button>
                                    {(() => {
                                      const historyItem =
                                        quizHistory[
                                          selectedReviewQuestionIndex
                                        ];
                                      if (!historyItem)
                                        return <p>Soal tidak ditemukan.</p>;
                                      return (
                                        <div className="review-item">
                                          <p className="review-question">
                                            <strong>
                                              Soal{" "}
                                              {selectedReviewQuestionIndex + 1}:
                                            </strong>{" "}
                                            "{historyItem.question.english}"
                                          </p>
                                          <p>
                                            Jawaban Benar:{" "}
                                            <strong className="correct-text">
                                              {
                                                historyItem.correctAnswer
                                                  .indonesian
                                              }
                                            </strong>
                                          </p>
                                          <p
                                            className={`review-user-answer ${historyItem.isCorrect ? "correct-text" : "wrong-text"}`}
                                          >
                                            Jawaban Anda:{" "}
                                            {historyItem.userAnswer.indonesian}{" "}
                                            {historyItem.isCorrect
                                              ? "(✓)"
                                              : "(✗)"}
                                          </p>
                                          <details className="review-options-details">
                                            <summary>
                                              Semua Pilihan Soal Ini
                                            </summary>
                                            <ul className="review-options-list">
                                              {historyItem.options.map(
                                                (option) => {
                                                  const isCorrectOption =
                                                    option.id ===
                                                    historyItem.correctAnswer
                                                      .id;
                                                  const isWrongAnswer =
                                                    option.id ===
                                                      historyItem.userAnswer
                                                        .id &&
                                                    !historyItem.isCorrect;
                                                  return (
                                                    <li
                                                      key={option.id}
                                                      className={`review-option ${isCorrectOption ? "correct-answer" : ""} ${isWrongAnswer ? "wrong-answer" : ""}`}
                                                    >
                                                      {option.indonesian}
                                                      {isCorrectOption && (
                                                        <span className="answer-icon correct">
                                                          {" "}
                                                          ✓
                                                        </span>
                                                      )}
                                                      {isWrongAnswer && (
                                                        <span className="answer-icon wrong">
                                                          {" "}
                                                          ✗
                                                        </span>
                                                      )}
                                                    </li>
                                                  );
                                                },
                                              )}
                                            </ul>
                                          </details>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}

                              <div className="quiz-actions review-actions">
                                <button
                                  onClick={toggleReview}
                                  className="secondary-button close-review-button"
                                >
                                  Hasil Quiz
                                </button>
                                <button
                                  onClick={restartQuiz}
                                  className="primary-button"
                                  title={
                                    savedVocabs.length < 4
                                      ? "Minimal 4 kata untuk mulai ulang"
                                      : "Mulai Ulang Quiz"
                                  }
                                >
                                  Mulai Ulang
                                </button>
                                <button
                                  onClick={() => setActiveTab("list")}
                                  className="secondary-button"
                                >
                                  Daftar Kosakata
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // --- Initial Welcome Message for Quiz Tab (or if quiz was abandoned) ---
                        <div>
                          <h3>Selamat Datang di Quiz Kosakata!</h3>
                          <p>
                            Quiz ini akan melatih vocab yang sudah dihafal. Saat
                            ini Anda telah menandai{" "}
                            <strong>{savedVocabs.length}</strong> kosakata dari
                            total {vocabList.length}.
                          </p>

                          {savedVocabs.length < 4 && (
                            <p className="warning-message">
                              Memerlukan minimal <strong>4</strong> kosakata
                              yang ditandai untuk memulai quiz.
                            </p>
                          )}

                          {savedVocabs.length >= 4 && (
                            <p>
                              Anda siap memulai quiz dengan{" "}
                              <strong>{savedVocabs.length}</strong> kata. Tekan
                              tombol di bawah ini untuk memulai!
                            </p>
                          )}

                          <div className="quiz-actions">
                            <button
                              onClick={startQuiz}
                              className="primary-button large"
                              title={
                                savedVocabs.length < 4
                                  ? "Tandai minimal 4 kata"
                                  : `Mulai quiz (${savedVocabs.length} kata)!`
                              }
                            >
                              Mulai Quiz
                            </button>
                            <button
                              onClick={() => setActiveTab("list")}
                              className="secondary-button"
                            >
                              Daftar Kosakata
                            </button>
                          </div>

                          {/* Show message if a quiz is in progress but no question is currently displayed (e.g., user navigated away and back) */}
                          {totalQuestions > 0 &&
                            questionsRemaining > 0 &&
                            currentQuestion === null && (
                              <div className="quiz-score last-score card-style resume-quiz-section">
                                <h4>Quiz Sedang Berlangsung</h4>
                                <p>Anda memiliki quiz yang belum selesai.</p>
                                <p className="score-value">
                                  Skor Sementara: {score} / {totalQuestions}{" "}
                                  Benar ({questionsRemaining} pertanyaan
                                  tersisa).
                                </p>
                                <button
                                  onClick={() => generateQuestion()}
                                  className="secondary-button"
                                >
                                  Lanjutkan Quiz
                                </button>
                                <button
                                  onClick={restartQuiz}
                                  className="secondary-button"
                                  title={
                                    savedVocabs.length < 4
                                      ? "Minimal 4 kata"
                                      : "Mulai Ulang Quiz"
                                  }
                                >
                                  Mulai Ulang Quiz
                                </button>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>{" "}
            {/* End tab-content */}
          </div> // End tabs
        )}{" "}
        {/* End conditional rendering for csvLoaded */}
      </div>{" "}
      {/* End app-content */}
    </div> // End app-container
  );
}

export default App;
