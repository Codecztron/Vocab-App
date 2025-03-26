// client/src/components/InputVocab.js
import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "./style/InputVocab.css";
import Button from "./Button";
import FormGroup from "./FormGroup";
import vocabService from "../services/vocabService"; // Import the service

function InputVocab() {
  const [rows, setRows] = useState([{ word: "", definition: "" }]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [translations, setTranslations] = useState({}); // Store translations
  const { userRole } = useContext(AuthContext); // Access user role

  const handleInputChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  const handleAddRow = () => {
    setRows([...rows, { word: "", definition: "" }]);
  };

  const handleTranslate = async (index) => {
    const textToTranslate = rows[index].word;
    if (!textToTranslate) return;
    try {
      const token = localStorage.getItem("token");
      const translation = await vocabService.translateVocab(
        textToTranslate,
        token,
      );
      setTranslations({ ...translations, [index]: translation });
    } catch (err) {
      setError(err.response?.data.message || "Translation failed");
    }
  };

  const handleSaveTranslation = async (index) => {
    const { word, definition } = rows[index];
    const translation = translations[index];
    if (!translation) return;

    try {
      const token = localStorage.getItem("token");
      const newVocab = {
        word,
        definition,
        translation, // Save the translation to the vocab
      };
      await vocabService.addVocab([newVocab], token);
      setMessage("Vocab added successfully!");
      setRows([{ word: "", definition: "" }]); // Clear form
      setTranslations({}); // Clear translations
    } catch (err) {
      setError(err.response?.data.message || "Failed to save translation");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const filteredRows = rows.filter(
      (row) => row.word.trim() !== "" && row.definition.trim() !== "",
    );
    if (filteredRows.length === 0) {
      setError("Please enter valid words and definitions.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await vocabService.addVocab(filteredRows, token);
      setMessage("Vocab added successfully!");
      setRows([{ word: "", definition: "" }]);
      setTranslations({}); // Clear the translations after submit
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
            <FormGroup label={`Word ${index + 1}:`} htmlFor={`word-${index}`}>
              <input
                type="text"
                id={`word-${index}`}
                placeholder="Word"
                value={row.word}
                onChange={(e) =>
                  handleInputChange(index, "word", e.target.value)
                }
              />
            </FormGroup>
            <FormGroup
              label={`Definition ${index + 1}:`}
              htmlFor={`definition-${index}`}
            >
              <input
                type="text"
                id={`definition-${index}`}
                placeholder="Definition"
                value={row.definition}
                onChange={(e) =>
                  handleInputChange(index, "definition", e.target.value)
                }
              />
            </FormGroup>
            <Button
              type="button"
              onClick={() => handleTranslate(index)}
              primary
              disabled={translations[index] !== undefined}
            >
              Translate
            </Button>{" "}
            {/* Disable if translated */}
            {translations[index] && (
              <p>
                Translation: {translations[index]}{" "}
                <Button
                  type="button"
                  onClick={() => handleSaveTranslation(index)}
                  className="save-button"
                >
                  Save Translation
                </Button>
              </p>
            )}
          </div>
        ))}
        <Button type="button" onClick={handleAddRow} className="add-row-button">
          Add Row
        </Button>
        <Button type="submit" className="save-button">
          Save
        </Button>
      </form>
    </div>
  );
}

export default InputVocab;
