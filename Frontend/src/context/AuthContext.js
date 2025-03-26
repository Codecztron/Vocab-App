// client/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setIsLoggedIn(true);
        setUserRole(role);
        setUsername(decodedToken.username); // Assuming username is in the token payload
      } catch (error) {
        console.error("Error decoding token:", error);
        // Handle invalid token (optional: logout user or clear storage)
        handleLogout(); // Example: logout if token is invalid
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    setUserRole(null);
    setUsername(null);
  };

  const value = {
    isLoggedIn,
    userRole,
    username,
    handleLogout,
    setIsLoggedIn,
    setUserRole,
    setUsername,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
