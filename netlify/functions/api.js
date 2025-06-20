const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const path = require("path");
const connectDB = require("../../backend/config/db"); // Adjust path
require("dotenv").config({
  path: path.resolve(__dirname, "../../backend/.env"),
});

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("../../backend/routes/auth"));
app.use("/api/transactions", require("../../backend/routes/transactions"));
app.use("/api/plaid", require("../../backend/routes/plaid"));
app.use("/api/user", require("../../backend/routes/user"));
app.use("/api/ai", require("../../backend/routes/ai"));

module.exports.handler = serverless(app);
