const express = require("express");
const { PlaidApi, PlaidEnvironments, Products, CountryCode } = require("plaid");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { protect } = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

const plaidClient = new PlaidApi({
  clientID: process.env.PLAID_CLIENT_ID,
  secret: process.env.PLAID_SECRET,
  env: PlaidEnvironments.sandbox,
});

router.post("/create_link_token", protect, async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: req.user.id },
      client_name: "BudgeX Finance Tracker",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error creating link token:", error.response.data);
    res.status(500).json({ error: "Could not create link token" });
  }
});

router.post("/exchange_public_token", protect, async (req, res) => {
  const { public_token } = req.body;
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });
    const { access_token, item_id } = response.data;

    await User.findByIdAndUpdate(req.user.id, {
      plaidAccessToken: access_token,
      plaidItemId: item_id,
    });

    res.json({ message: "Public token exchanged successfully" });
  } catch (error) {
    console.error("Error exchanging public token:", error);
    res.status(500).json({ error: "Could not exchange public token" });
  }
});

router.get("/transactions", protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user.plaidAccessToken) {
    return res.status(400).json({ error: "Plaid not connected" });
  }

  const startDate = user.plaidLastSync
    ? user.plaidLastSync.toISOString().split("T")[0]
    : "2023-01-01";
  const endDate = new Date().toISOString().split("T")[0];

  try {
    const response = await plaidClient.transactionsSync({
      access_token: user.plaidAccessToken,
    });

    const added = response.data.added;

    for (const plaidTx of added) {
      const existingTx = await Transaction.findOne({
        plaidTransactionId: plaidTx.transaction_id,
      });
      if (!existingTx) {
        await Transaction.create({
          user: req.user.id,
          title: plaidTx.name,
          amount: plaidTx.amount,
          category: plaidTx.category ? plaidTx.category[0] : "Other",
          date: new Date(plaidTx.date),
          type: plaidTx.amount > 0 ? "income" : "expense",
          plaidTransactionId: plaidTx.transaction_id,
        });
      }
    }

    await User.findByIdAndUpdate(req.user.id, { plaidLastSync: new Date() });

    res.json({ message: `${added.length} transactions synced.` });
  } catch (error) {
    console.error("Error fetching Plaid transactions:", error.response.data);
    res.status(500).json({ error: "Could not fetch transactions" });
  }
});

module.exports = router;
