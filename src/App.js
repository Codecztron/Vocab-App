// App.js
import React, { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
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
    const updatedVocabs = [...newVocabs];
    updatedVocabs[index][field] = value;
    setNewVocabs(updatedVocabs);
  };

  const handleAddVocabField = () => {
    setNewVocabs([...newVocabs, { english: "", indonesian: "" }]);
  };

  const handleRemoveVocabField = (index) => {
    const updatedVocabs = [...newVocabs];
    updatedVocabs.splice(index, 1);
    setNewVocabs(updatedVocabs);
  };

  const handleSaveVocabs = () => {
    // Filter out empty entries
    const validVocabs = newVocabs.filter(
      (vocab) => vocab.english.trim() && vocab.indonesian.trim(),
    );

    if (validVocabs.length === 0) {
      return; // Don't save if no valid entries
    }

    // Prepare the new vocab items to be added
    const newVocabItems = validVocabs.map((vocab, index) => ({
      id: vocabList.length + index,
      english: vocab.english.trim(),
      indonesian: vocab.indonesian.trim(),
      learned: false, // Default to not learned for new entries
    }));

    // Update vocabList by combining existing and new vocabs
    setVocabList([...vocabList, ...newVocabItems]);

    // Reset the input fields after saving
    setNewVocabs([{ english: "", indonesian: "" }]);

    // Optionally show an alert indicating success
    // showAlert("Kosakata berhasil ditambahkan!", "success");
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
    if (isLoggedIn) {
      setIsLoading(true); // Set loading true when starting to load data
      // Load CSV file
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
          // Optionally show an alert here too
          // showAlert("Gagal memuat file CSV. Coba unggah manual.", "error");
          setIsLoading(false); // Stop loading indicator on fetch error
        });

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
  }, [isLoggedIn, parseCSV]); // Effect depends on isLoggedIn

  // Handle manual file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsLoading(true); // Show loading while parsing uploaded file
      const reader = new FileReader();
      reader.onload = (e) => {
        parseCSV(e.target.result);
        setCsvLoaded(true); // Mark as loaded after successful parse attempt
        // setIsLoading(false) is handled within parseCSV
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
    // Only save if vocabList has been populated (implies CSV loaded/parsed)
    // And only save if logged in (though this check might be redundant if state resets on logout)
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
    // Removed vocabList.length dependency as saving an empty array is valid
  }, [savedVocabs, isLoggedIn, vocabList.length]);

  // Toggle learned status for a single vocabulary item
  const toggleLearned = (id) => {
    let isNowLearned;
    // Update the main vocabList state first
    setVocabList(
      vocabList.map((vocab) => {
        if (vocab.id === id) {
          isNowLearned = !vocab.learned; // Determine the new status
          return { ...vocab, learned: isNowLearned };
        }
        return vocab;
      }),
    );

    // Update the savedVocabs (list of IDs) state based on the new status
    if (isNowLearned) {
      // Add the ID if it's not already there (safety check)
      if (!savedVocabs.includes(id)) {
        setSavedVocabs([...savedVocabs, id]);
      }
    } else {
      // Remove the ID
      setSavedVocabs(savedVocabs.filter((vocabId) => vocabId !== id));
    }
  };

  // Toggle learned status for all vocabulary items
  const toggleAllLearned = () => {
    const allCurrentlyLearned = vocabList.every((vocab) => vocab.learned);
    const targetLearnedStatus = !allCurrentlyLearned;

    // Update the main vocabList
    const updatedVocabList = vocabList.map((vocab) => ({
      ...vocab,
      learned: targetLearnedStatus,
    }));
    setVocabList(updatedVocabList);

    // Update the savedVocabs list accordingly
    const updatedSavedVocabs = targetLearnedStatus
      ? updatedVocabList.map((vocab) => vocab.id) // All IDs if marking all as learned
      : []; // Empty array if marking all as not learned
    setSavedVocabs(updatedSavedVocabs);
  };

  // Start quiz
  const startQuiz = () => {
    // Filter based on the 'learned' property which should be in sync with savedVocabs
    const learnedVocabs = vocabList.filter((vocab) => vocab.learned);

    // Use the derived list length for the check
    if (learnedVocabs.length < 4) {
      showAlert(
        'Anda perlu menandai minimal 4 kosakata sebagai "sudah dihafal" untuk memulai quiz!',
        "warning",
      );
      return; // Stop if not enough words
    }

    // Shuffle the learned vocabs for the quiz order
    const shuffledLearnedVocabs = [...learnedVocabs].sort(
      () => Math.random() - 0.5,
    );

    // Reset quiz state comprehensively
    setQuizVocabs(shuffledLearnedVocabs);
    setQuestionsRemaining(shuffledLearnedVocabs.length);
    setScore(0);
    setTotalQuestions(0); // Reset count of questions *answered* in this session
    setQuizHistory([]);
    setShowResult(false); // Ensure no lingering result display from previous question
    setSelectedOption(null); // Ensure no lingering selection
    setIsCorrect(false); // Ensure no lingering correctness status
    setShowReview(false); // Hide review view if it was open
    setSelectedReviewQuestionIndex(null); // Reset review index

    // Generate the first question using the freshly shuffled list
    generateQuestion(shuffledLearnedVocabs);

    // Switch to the quiz tab automatically when starting
    setActiveTab("quiz"); // Ensure the user sees the quiz interface
  };

  // Restart Quiz
  const restartQuiz = () => {
    // Re-filter learned vocabs in case changes were made
    const learnedVocabs = vocabList.filter((vocab) => vocab.learned);

    if (learnedVocabs.length < 4) {
      showAlert(
        'Tidak cukup kosakata yang ditandai "sudah dihafal" (minimal 4) untuk memulai ulang quiz.',
        "warning",
      );
      // Do not switch tab, just show alert
      return; // Stop the restart process
    }
    // Re-shuffle for the new quiz session
    const shuffledLearnedVocabs = [...learnedVocabs].sort(
      () => Math.random() - 0.5,
    );

    // Reset quiz state (similar to startQuiz)
    setQuizVocabs(shuffledLearnedVocabs);
    setQuestionsRemaining(shuffledLearnedVocabs.length);
    setScore(0);
    setTotalQuestions(0); // Reset total questions for the new session
    setQuizHistory([]);
    setShowResult(false);
    setSelectedOption(null);
    setIsCorrect(false);
    setShowReview(false);
    setSelectedReviewQuestionIndex(null);

    // Generate the first question from the new list
    generateQuestion(shuffledLearnedVocabs);

    // No need to switch tab, already on quiz tab
  };

  // Generate a new question
  // Accepts the current list of vocabs remaining in the quiz as an argument
  const generateQuestion = (currentQuizVocabList = quizVocabs) => {
    // Check state for remaining questions first
    if (questionsRemaining <= 0) {
      setCurrentQuestion(null); // No more questions left
      setShowResult(false); // Ensure result display is off
      setSelectedOption(null);
      return; // Exit generation
    }

    // Use the passed list or the state list (passed list is usually more up-to-date)
    const vocabsToUse = currentQuizVocabList;

    // Safety check: If somehow list is empty but state says questions remain
    if (vocabsToUse.length === 0) {
      console.error(
        "Generate question called with empty vocabs list, but questionsRemaining > 0. Resetting quiz state.",
      );
      setCurrentQuestion(null);
      setQuestionsRemaining(0); // Correct the state inconsistency
      // Optionally show an error to the user or navigate away
      // showAlert('Terjadi kesalahan internal saat memuat soal berikutnya.', 'error');
      // setActiveTab('list');
      return;
    }

    // Select the next question: consistently take the first element from the (shuffled) list
    const question = vocabsToUse[0];

    // Prepare options: The correct answer + 3 distractors
    let optionVocabs = [question];

    // Get potential distractors: *all* vocabs EXCLUDING the current question
    // Changed from only 'learned' distractors to potentially include unlearned ones
    // if necessary, to ensure 4 options are always available if possible.
    // Prioritize learned distractors first.
    const learnedDistractors = vocabList.filter(
      (v) => v.learned && v.id !== question.id,
    );
    const unlearnedVocabs = vocabList.filter(
      (v) => !v.learned && v.id !== question.id,
    );

    // Shuffle potential distractors
    const shuffledLearnedDistractors = [...learnedDistractors].sort(
      () => Math.random() - 0.5,
    );
    const shuffledUnlearned = [...unlearnedVocabs].sort(
      () => Math.random() - 0.5,
    );

    // Add up to 3 distractors, prioritizing learned ones
    let addedDistractors = 0;
    for (
      let i = 0;
      i < shuffledLearnedDistractors.length && addedDistractors < 3;
      i++
    ) {
      optionVocabs.push(shuffledLearnedDistractors[i]);
      addedDistractors++;
    }
    // If still need more distractors, pull from unlearned ones
    for (let i = 0; i < shuffledUnlearned.length && addedDistractors < 3; i++) {
      optionVocabs.push(shuffledUnlearned[i]);
      addedDistractors++;
    }

    // Fallback: if still less than 4 options (e.g., total vocab < 4), this part might run,
    // but the startQuiz check should prevent this specific scenario for quiz start.
    // This ensures 4 options even if duplicates might technically occur in extreme edge cases (very small vocab list).
    let fallbackAttempts = 0;
    while (
      optionVocabs.length < 4 &&
      vocabList.length > 1 &&
      fallbackAttempts < 10
    ) {
      let fallbackIndex = Math.floor(Math.random() * vocabList.length);
      let fallbackVocab = vocabList[fallbackIndex];
      // Add if it's not the question itself (though it might already be an option)
      if (
        fallbackVocab.id !== question.id &&
        !optionVocabs.some((opt) => opt.id === fallbackVocab.id)
      ) {
        optionVocabs.push(fallbackVocab);
      }
      fallbackAttempts++; // Prevent infinite loop
    }

    // Final shuffle of the options to be displayed
    const shuffledOptions = optionVocabs.sort(() => Math.random() - 0.5);

    // Set state for the new question
    setCurrentQuestion(question);
    setOptions(shuffledOptions);
    setSelectedOption(null); // Clear previous selection
    setShowResult(false); // Hide result/feedback from previous question
    setIsCorrect(false); // Reset correctness
  };

  // Handle answer selection
  const handleSelectOption = (option) => {
    if (showResult || !currentQuestion) return; // Prevent changes after result is shown or if no question

    const correct = option.id === currentQuestion.id;
    setSelectedOption(option);
    setIsCorrect(correct);
    setShowResult(true); // Show feedback immediately

    let currentScore = score; // Use a temp variable if score update depends on correctness
    if (correct) {
      currentScore++; // Increment score locally first
      setScore(currentScore); // Update state
    }

    // Add to history BEFORE updating state for next question potentially
    setQuizHistory((prevHistory) => [
      ...prevHistory,
      {
        question: currentQuestion,
        options: options, // Store the options shown for this question
        correctAnswer: currentQuestion, // The correct vocab object
        userAnswer: option, // The vocab object the user selected
        isCorrect: correct,
      },
    ]);

    // Decrement remaining questions count immediately after answering
    const remaining = questionsRemaining - 1;
    setQuestionsRemaining(remaining);

    // Remove the answered question from the *state* holding the list for the *next* generation
    // This uses the functional update form of setState for safety
    setQuizVocabs((prevQuizVocabs) => prevQuizVocabs.slice(1)); // Remove the first element

    // Do NOT generate the next question here. Wait for the "Next" button click.
    // Incrementing totalQuestions is handled in handleNextQuestion.
  };

  // Go to next question OR finish quiz
  const handleNextQuestion = () => {
    // Increment total questions *answered* when moving to the next or finishing
    setTotalQuestions(totalQuestions + 1);

    if (questionsRemaining > 0) {
      // Generate the next question using the already updated quizVocabs list state
      generateQuestion(); // No need to pass quizVocabs, it will use the state
    } else {
      // Quiz finished
      setCurrentQuestion(null); // Clear current question
      setShowResult(false); // Hide result/options section for the last question
      setSelectedOption(null);
      // Final score is already calculated, state reflects the end of the quiz
      // User is now shown the results screen within the quiz tab
    }
  };

  // Toggle visibility of the quiz review section
  const toggleReview = () => {
    setShowReview(!showReview);
    setSelectedReviewQuestionIndex(null); // Reset selected index when toggling review view
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
    event.preventDefault(); // Prevent default form submission
    // Simple validation
    if (!username || !password) {
      setLoginError("Username dan password tidak boleh kosong.");
      return;
    }
    setLoginError(null); // Clear previous error

    // Get credentials from environment variables or use fallbacks
    const expectedUsername = process.env.REACT_APP_VOCAB_APP_USER;
    const expectedPassword = process.env.REACT_APP_VOCAB_APP_PASSWORD;

    // Check credentials
    if (username === expectedUsername && password === expectedPassword) {
      setIsLoggedIn(true);
      // Data loading is triggered by the useEffect watching isLoggedIn
    } else {
      setIsLoggedIn(false);
      setLoginError("Username atau password salah.");
      setPassword(""); // Clear password field on failed attempt for security/UX
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    // Reset all application state to default values
    setVocabList([]);
    setSavedVocabs([]);
    setIsLoading(false); // Ensure loading is false on logout screen
    setActiveTab("list"); // Reset to default tab
    setCurrentQuestion(null);
    setOptions([]);
    setSelectedOption(null);
    setShowResult(false);
    setIsCorrect(false);
    setScore(0);
    setTotalQuestions(0);
    setCsvLoaded(false); // Reset CSV loaded status
    setQuizVocabs([]);
    setQuestionsRemaining(0);
    setQuizHistory([]);
    setShowReview(false);
    setSelectedReviewQuestionIndex(null);
    setUsername(""); // Clear username input field
    setPassword(""); // Clear password input field
    setLoginError(null); // Clear any login errors
    // Optional: Clear localStorage? Decide based on persistence needs.
    // localStorage.removeItem("learnedVocabs"); // Uncomment if progress shouldn't persist across logouts
  };

  // ---------- RENDER LOGIC ----------

  // Loading state UI (only show if logged in and loading)
  if (isLoading && isLoggedIn) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-message">Memuat data...</div>
        {/* Keep the upload section visible during initial load if fetch is slow/fails */}
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
          <h2 className="login-title">Vocab App Login</h2>
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
          {/* <div className="header-user-info">
            <span>Welcome, {username}!</span>
            <button onClick={handleLogout} className="secondary-button logout-button-header">Logout</button>
          </div> */}
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

                    {/* <p className="format-hint">
                      Format: Inggris;Indonesia per baris (setelah menyimpan)
                    </p>

                    Button to trigger file upload and parsing
                    <label
                      htmlFor="csv-upload-manual"
                      className="upload-button"
                    >
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
                    </label> */}
                  </div>
                </div>
              )}

              {/* Developer Tab */}
              {activeTab === "dev" && (
                <div className="dev-info-tab card-style">
                  <h2 className="dev-title">Developer Info</h2>
                  <p className="dev-intro">
                    Aplikasi ini dikembangkan oleh Andri Kusuma. Jangan ragu
                    untuk terhubung atau mendukung developer!
                  </p>
                  <div className="dev-contact-grid">
                    <div className="dev-contact-item">
                      <strong className="dev-contact-label">Instagram:</strong>
                      <a
                        href="https://www.instagram.com/andrksuma/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dev-contact-link instagram-link"
                      >
                        @andrksuma
                      </a>
                    </div>
                    <div className="dev-contact-item">
                      <strong className="dev-contact-label">Email:</strong>
                      <a
                        href="mailto:andribussi76@gmail.com"
                        className="dev-contact-link email-link"
                      >
                        andribussi76@gmail.com
                      </a>
                    </div>
                  </div>
                  <div className="dev-support-section">
                    <h3>Dukung Developer</h3>
                    <p>
                      Jika Anda merasa aplikasi ini bermanfaat, pertimbangkan
                      untuk mendukung pengembangannya:
                    </p>
                    <a
                      href="https://saweria.co/Codecztron"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dev-support-button primary-button"
                    >
                      Dukung via Saweria ☕
                    </a>
                  </div>
                </div>
              )}

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
                          savedVocabs.length === vocabList.length // More reliable check
                            ? "Batal Tandai Semua"
                            : "Tandai Semua"}
                        </button>
                        <button
                          onClick={startQuiz}
                          className="primary-button"
                          disabled={savedVocabs.length < 4}
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

                  {vocabList.length > 0 ? (
                    <div className="vocab-table-container card-style">
                      <table className="vocab-table">
                        <thead>
                          <tr>
                            <th className="col-english">Inggris</th>
                            <th className="col-indonesian">Indonesia</th>
                            <th className="col-status">Sudah Hafal?</th>
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
                                <label
                                  className="checkbox-container"
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
                                  <span className="checkmark"></span>
                                </label>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="card-style empty-list-message">
                      <p>
                        Daftar kosakata kosong. Jika Anda baru saja mengunggah
                        file, pastikan formatnya benar ('Inggris;Indonesia') dan
                        file tidak kosong.
                      </p>
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
                      {/* Total questions in *this specific quiz* is the initial number */}
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
                        {options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleSelectOption(option)}
                            className={`quiz-option ${
                              selectedOption // Base class
                                ? selectedOption.id === option.id // Style the selected option
                                  ? isCorrect
                                    ? "correct-answer selected" // Specifically selected and correct
                                    : "wrong-answer selected" // Specifically selected and wrong
                                  : showResult && // Style the correct answer if shown *and* it wasn't the selected one
                                      option.id === currentQuestion.id
                                    ? "correct-answer"
                                    : ""
                                : "" // No selection yet
                            } ${showResult ? "disabled" : ""}`} // Visual disable when result shown
                            disabled={showResult} // Actual disable after answering
                          >
                            {option.indonesian}
                            {/* Icons based on result */}
                            {showResult && option.id === currentQuestion.id && (
                              <span
                                className={`answer-icon ${selectedOption?.id === option.id && isCorrect ? "selected-correct" : "correct"}`}
                              >
                                {" "}
                                ✓
                              </span>
                            )}
                            {showResult &&
                              selectedOption?.id === option.id &&
                              !isCorrect && (
                                <span className="answer-icon wrong"> ✗</span>
                              )}
                          </button>
                        ))}
                      </div>

                      {showResult && (
                        <div className="quiz-result">
                          <button
                            onClick={handleNextQuestion}
                            className="primary-button next-question-button"
                          >
                            {questionsRemaining > 0
                              ? "Soal Berikutnya →"
                              : "Lihat Hasil Akhir"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    // --- Quiz Welcome / Results Screen ---
                    <div className="quiz-welcome card-style">
                      {/* Condition: Quiz was completed (totalQuestions > 0 means at least one question was answered AND moved past)
                           AND no questions remain (questionsRemaining === 0) */}
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
                                  Lihat Review Soal ({quizHistory.length})
                                </button>
                                <button
                                  onClick={restartQuiz}
                                  className="primary-button"
                                  disabled={savedVocabs.length < 4}
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
                                  Kembali ke Daftar Kosakata
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
                                    className={`minimap-button ${
                                      selectedReviewQuestionIndex === index
                                        ? "active"
                                        : ""
                                    } ${historyItem.isCorrect ? "correct" : "wrong"}`}
                                    onClick={() => handleMinimapClick(index)}
                                    title={`Lihat Soal ${index + 1} (${historyItem.isCorrect ? "Benar" : "Salah"})`}
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
                                        return <p>Soal tidak ditemukan.</p>; // Safety check
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
                                            className={`review-user-answer ${
                                              historyItem.isCorrect
                                                ? "correct-text"
                                                : "wrong-text"
                                            }`}
                                          >
                                            Jawaban Anda:{" "}
                                            {historyItem.userAnswer.indonesian}{" "}
                                            {historyItem.isCorrect
                                              ? "(✓)"
                                              : "(✗)"}
                                          </p>
                                          <details className="review-options-details">
                                            <summary>
                                              Lihat Semua Pilihan Soal Ini
                                            </summary>
                                            <ul className="review-options-list">
                                              {historyItem.options.map(
                                                (option) => (
                                                  <li
                                                    key={option.id}
                                                    className={`review-option ${
                                                      option.id ===
                                                      historyItem.correctAnswer
                                                        .id
                                                        ? "correct-answer" // Highlight correct answer
                                                        : ""
                                                    } ${
                                                      option.id ===
                                                        historyItem.userAnswer
                                                          .id &&
                                                      !historyItem.isCorrect
                                                        ? "wrong-answer" // Highlight user's wrong answer
                                                        : ""
                                                    }`}
                                                  >
                                                    {option.indonesian}
                                                    {option.id ===
                                                      historyItem.correctAnswer
                                                        .id && (
                                                      <span className="answer-icon correct">
                                                        {" "}
                                                        ✓
                                                      </span>
                                                    )}
                                                    {option.id ===
                                                      historyItem.userAnswer
                                                        .id &&
                                                      !historyItem.isCorrect && (
                                                        <span className="answer-icon wrong">
                                                          {" "}
                                                          ✗
                                                        </span>
                                                      )}
                                                  </li>
                                                ),
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
                                  onClick={toggleReview} // Button to close review -> back to score
                                  className="secondary-button close-review-button"
                                >
                                  Kembali ke Hasil Quiz
                                </button>
                                <button
                                  onClick={restartQuiz}
                                  className="primary-button"
                                  disabled={savedVocabs.length < 4}
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
                                  Kembali ke Daftar Kosakata
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
                            Quiz ini akan menguji kata-kata yang telah Anda
                            tandai sebagai "sudah dihafal". Saat ini Anda telah
                            menandai <strong>{savedVocabs.length}</strong>{" "}
                            kosakata dari total {vocabList.length}.
                          </p>

                          {savedVocabs.length < 4 && (
                            <p className="warning-message">
                              Anda memerlukan minimal <strong>4</strong>{" "}
                              kosakata yang ditandai untuk memulai quiz. Silakan
                              kembali ke daftar kosakata dan tandai beberapa
                              kata.
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
                              disabled={savedVocabs.length < 4}
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
                              Kembali ke Daftar Kosakata
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
                                  onClick={() => generateQuestion()} // Regenerate question to continue
                                  className="secondary-button"
                                >
                                  Lanjutkan Quiz
                                </button>
                                <button
                                  onClick={restartQuiz} // Offer restart as well
                                  className="secondary-button"
                                  disabled={savedVocabs.length < 4}
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
