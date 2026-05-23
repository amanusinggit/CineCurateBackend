require("dotenv").config();
const express = require("express");
const GoogleGenAI = require("@google/genai").GoogleGenAI;
const { initializeApp } = require("firebase-admin/app");
var admin = require("firebase-admin");
const cors = require("cors");

var serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

const authenticateFirebaseToken = async (idToken) => {
  try {
    const status = await getAuth().verifyIdToken(idToken);
  } catch (error) {
    console.log("firebase: ", error.message);
  }
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
