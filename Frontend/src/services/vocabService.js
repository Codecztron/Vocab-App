// client/src/services/vocabService.js
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL + "/api/vocab";

const getAllVocab = async (token) => {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
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

const searchVocab = async (query, token) => {
  try {
    const response = await axios.get(`${API_URL}/search?query=${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const translateVocab = async (text, token) => {
  // New function
  try {
    const response = await axios.post(
      `${API_URL}/translate`,
      { text },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data.translatedText;
  } catch (error) {
    throw error;
  }
};

const saveTranslation = async (vocabId, translation, token) => {
  // New function
  try {
    const response = await axios.post(
      `${API_URL}/save-translation`,
      { vocabId, translation },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data.vocab;
  } catch (error) {
    throw error;
  }
};

export default {
  getAllVocab,
  addVocab,
  getQuiz,
  searchVocab,
  translateVocab,
  saveTranslation,
};
