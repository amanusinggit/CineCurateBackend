require("dotenv").config();
const express = require("express");
const GoogleGenAI = require("@google/genai").GoogleGenAI;

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true }));
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${process.env.REACT_APP_TMDB_TOKEN}`,
  },
};

const interactGemni = async (prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            movies: {
              type: "array",
              minItems: 10,
              items: { type: "string" },
            },
          },
          required: ["movies"],
          additionalProperties: false,
        },
      },
    });
    const movies = JSON.parse(response.text);
    return movies;
  } catch (error) {
    console.log("gemini error", error.message);
  }
};

app.post("/", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    console.log("Received prompt:", prompt);
    const movies = await interactGemni(prompt);
    console.log("Recommended movies:", movies);
    res.send(movies);
  } catch (error) {
    res.send(`Error: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
