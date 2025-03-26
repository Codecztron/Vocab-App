// client/src/services/authService.js
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL; // Base URL

const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    throw error; // Re-throw to handle in component
  }
};

export default { login };
