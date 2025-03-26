// client/src/App.js
import React, { useContext } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import VocabList from "./components/VocabList";
import InputVocab from "./components/InputVocab";
import Quiz from "./components/Quiz";
import { AuthContext } from "./context/AuthContext";
import "./App.css"; // Import global styles

function App() {
  const { isLoggedIn, userRole, handleLogout, username } =
    useContext(AuthContext);

  return (
    <div className="app-container">
      <header className="app-header">
        <nav>
          {isLoggedIn && (
            <>
              <Link to="/" className="nav-link">
                Dashboard
              </Link>
              <Link to="/vocab" className="nav-link">
                Vocab List
              </Link>
              <Link to="/input-vocab" className="nav-link">
                Input Vocab
              </Link>
              <Link to="/quiz" className="nav-link">
                Quiz
              </Link>
              <span className="user-info">
                Logged in as: {username} ({userRole})
              </span>
              <button onClick={handleLogout} className="nav-button logout">
                Logout
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/vocab"
            element={isLoggedIn ? <VocabList /> : <Navigate to="/login" />}
          />
          <Route
            path="/input-vocab"
            element={isLoggedIn ? <InputVocab /> : <Navigate to="/login" />}
          />
          <Route
            path="/quiz"
            element={isLoggedIn ? <Quiz /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
