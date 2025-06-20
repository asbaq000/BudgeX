const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({
      date: -1,
    });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/", async (req, res) => {
  const { title, amount, category, date, type, notes } = req.body;

  try {
    const newTransaction = new Transaction({
      user: req.user.id,
      title,
      amount,
      category,
      date,
      type,
      notes,
    });

    const transaction = await newTransaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.put("/:id", async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);
    if (!transaction)
      return res.status(404).json({ msg: "Transaction not found" });

    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);
    if (!transaction)
      return res.status(404).json({ msg: "Transaction not found" });

    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ msg: "Transaction removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.get("/summary", async (req, res) => {
  try {
    const totalIncome = await Transaction.aggregate([
      { $match: { user: req.user._id, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalExpense = await Transaction.aggregate([
      { $match: { user: req.user._id, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const income = totalIncome.length > 0 ? totalIncome[0].total : 0;
    const expense = totalExpense.length > 0 ? totalExpense[0].total : 0;
    const balance = income - expense;

    res.json({ income, expense, balance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
