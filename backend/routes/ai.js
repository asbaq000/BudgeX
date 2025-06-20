const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { protect } = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in .env file");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/advice", protect, async (req, res) => {
  const { transactions } = req.body;

  if (!transactions || transactions.length === 0) {
    return res.status(400).json({ message: "No transaction data provided." });
  }

  const spendingData = transactions
    .filter((t) => t.type === "expense")
    .map((t) => ({ category: t.category, amount: t.amount }));

  const prompt = `
    You are a friendly and helpful financial advisor.
    Based on the following JSON array of a user's spending data, provide concise and actionable financial advice.
    The user wants to know their top 3 spending categories and one practical tip for each to save money.
    Format the response as clean, readable text. Keep the tone encouraging.
    IMPORTANT: All monetary values must be presented in Pakistani Rupees (PKR), not dollars ($).

    User's Spending Data (in PKR):
    ${JSON.stringify(spendingData, null, 2)}
    `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ advice: text.trim() });
  } catch (error) {
    console.error("--- Google Gemini API Error ---");
    console.error(error);
    res.status(500).json({ message: "Failed to get AI advice from Gemini." });
  }
});

module.exports = router;
