// client/src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom"; // Import Router
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        {" "}
        {/* Wrap App with Router */}
        <App />
      </Router>
    </AuthProvider>
  </React.StrictMode>,
);
