// client/src/components/VocabCard.js
import React from "react";
import "./style/VocabCard.css";

function VocabCard({ word, definition, translation }) {
  return (
    <div className="vocab-card">
      <h3 className="card-word">{word}</h3>
      <p className="card-definition">{definition}</p>
      {translation && (
        <p className="card-translation">Translation: {translation}</p>
      )}
    </div>
  );
}

export default VocabCard;
