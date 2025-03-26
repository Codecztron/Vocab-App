// client/src/components/VocabList.js
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import VocabCard from "./VocabCard"; // Import VocabCard
import "./style/VocabList.css";

function VocabList() {
  const [vocab, setVocab] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { userRole } = useContext(AuthContext);

  useEffect(() => {
    const fetchVocab = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/vocab", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setVocab(response.data);
      } catch (err) {
        setError(err.response?.data.message || "Failed to fetch vocab");
      } finally {
        setLoading(false);
      }
    };

    fetchVocab();
  }, []);

  return (
    <div className="vocab-list-container">
      <h2>Vocab List</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}
      <div className="vocab-cards-grid">
        {" "}
        {/* Use a grid for layout */}
        {vocab.map((item) => (
          <VocabCard
            key={item._id}
            word={item.word}
            definition={item.definition}
            translation={item.translation}
          />
        ))}
      </div>
      {userRole === "admin" && <p>Admin features will be available here.</p>}
    </div>
  );
}

export default VocabList;
