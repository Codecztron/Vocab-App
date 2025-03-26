// client/src/components/Button.js (Reusable Button Component)
import React from "react";
import "./style/Button.css";

function Button({ children, onClick, type = "button", className, disabled }) {
  // Added type and disabled
  return (
    <button
      className={`custom-button ${className || ""}`} // Allows for custom classes
      onClick={onClick}
      type={type} // Set button type
      disabled={disabled} // Set disabled state
    >
      {children}
    </button>
  );
}

export default Button;
