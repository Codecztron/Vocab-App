// server/utils/translate.js
const axios = require("axios"); // Import axios
require("dotenv").config();

async function translateText(text) {
  try {
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_AI_STUDIO_API_KEY not set");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta3/models/gemini-1.0-pro-001:generateContent?key=${apiKey}`; // Or other Gemini model

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Translate the following English text to Indonesian: "${text}"`, // Prompt
            },
          ],
        },
      ],
    };

    const response = await axios.post(url, payload);

    // Assuming the translation is in the response
    const translation = response.data.candidates[0].content.parts[0].text;

    return translation;
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

module.exports = { translateText };
