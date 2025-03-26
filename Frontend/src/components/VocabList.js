// client/src/components/VocabList.js
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import VocabCard from "./VocabCard";
import "./style/VocabList.css";
import vocabService from "../services/vocabService";

function VocabList() {
  const [vocab, setVocab] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { userRole } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const data = await vocabService.getAllVocab(token);
        setVocab(data);
      } catch (err) {
        setError(err.response?.data.message || "Failed to fetch vocab");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const results = await vocabService.searchVocab(searchQuery, token);
      setVocab(results);
    } catch (err) {
      setError(err.response?.data.message || "Failed to search vocab");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vocab-list-container">
      <h2>Vocab List</h2>
      {error && <p className="error-message">{error}</p>}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search vocab..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
      {loading && <p>Loading...</p>}

      <div className="vocab-cards-grid">
        {vocab.map((item) => (
          <VocabCard
            key={item._id}
            word={item.word}
            definition={item.definition}
            translation={item.translation}
          />
        ))}
      </div>
      {(userRole === "admin" || userRole === "dev") && (
        <p>Admin features will be available here.</p>
      )}
    </div>
  );
}

export default VocabList;
