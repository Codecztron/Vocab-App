// client/src/services/vocabService.js
import axios from "axios";

const API_URL = "/api/vocab";

const getAllVocab = async (token) => {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error; // Re-throw to handle in component
  }
};

const addVocab = async (vocabData, token) => {
  try {
    const response = await axios.post(API_URL, vocabData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getQuiz = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/quiz`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default { getAllVocab, addVocab, getQuiz };
