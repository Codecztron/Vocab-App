// client/src/components/FormGroup.js
import React from "react";
import "./style/FormGroup.css";

function FormGroup({ children, label, htmlFor }) {
  return (
    <div className="form-group">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
    </div>
  );
}

export default FormGroup;
