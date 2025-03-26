// client/src/components/Login.js
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "./style/Login.css";
import Button from "./Button"; // Import Button
import FormGroup from "./FormGroup"; // Import FormGroup

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    setIsLoggedIn,
    setUserRole,
    setUsername: setContextUsername,
  } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous errors
    setLoading(true); // Set loading to true
    try {
      const response = await axios.post("/api/auth/login", {
        username,
        password,
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("username", response.data.username); // Store the username
      setContextUsername(response.data.username); // Set the username in AuthContext
      setIsLoggedIn(true);
      setUserRole(response.data.role);
      navigate("/");
    } catch (err) {
      setError(err.response?.data.message || "Login failed");
    } finally {
      setLoading(false); // Always set loading to false after the request
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <FormGroup label="Username:" htmlFor="username">
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </FormGroup>
        <FormGroup label="Password:" htmlFor="password">
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormGroup>
        <Button type="submit" primary disabled={loading}>
          {" "}
          {/* Using Button component */}
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </div>
  );
}

export default Login;
