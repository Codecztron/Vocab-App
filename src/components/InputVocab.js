// client/src/components/InputVocab.js
import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "./style/InputVocab.css";

function InputVocab(d) {
  const [rows, setRows] = useState([{ word: "", definition: "" }]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { userRole } = useContext(AuthContext);

  const handleInputChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  const handleAddRow = () => {
    setRows([...rows, { word: "", definition: "" }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const filteredRows = rows.filter(
      (row) => row.word.trim() !== "" && row.definition.trim() !== "",
    ); // Filter out empty rows
    if (filteredRows.length === 0) {
      setError("Please enter valid words and definitions.");
      return;
    }
    try {
      await axios.post("/api/vocab", filteredRows, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setMessage("Vocab added successfully!");
      setRows([{ word: "", definition: "" }]); // Clear form
    } catch (err) {
      setError(err.response?.data.message || "Failed to add vocab");
    }
  };

  return (
    <div className="input-vocab-container">
      <h2>Input Vocab</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        {rows.map((row, index) => (
          <div key={index} className="input-row">
            <input
              type="text"
              placeholder="Word"
              value={row.word}
              onChange={(e) => handleInputChange(index, "word", e.target.value)}
            />
            <input
              type="text"
              placeholder="Definition"
              value={row.definition}
              onChange={(e) =>
                handleInputChange(index, "definition", e.target.value)
              }
            />
          </div>
        ))}
        <button type="button" onClick={handleAddRow} className="add-row-button">
          Add Row
        </button>
        <button type="submit" className="save-button">
          Save
        </button>
      </form>
    </div>
  );
}

export default InputVocab;
