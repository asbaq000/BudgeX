import React, { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import TransactionForm from "../components/TransactionForm";
import "./TransactionPage.css";

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [filters, setFilters] = useState({ searchTerm: "", type: "all" });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/transactions");
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await api.delete(`/transactions/${id}`);
        setTransactions(transactions.filter((t) => t._id !== id));
      } catch (error) {
        console.error("Failed to delete transaction:", error);
      }
    }
  };

  const handleEdit = (transaction) => {
    setTransactionToEdit(transaction);
    setIsFormVisible(true);
  };

  const handleAddNew = () => {
    setTransactionToEdit(null);
    setIsFormVisible(true);
  };

  const handleFormSubmit = (updatedOrNewTransaction) => {
    if (transactionToEdit) {
      
      setTransactions(
        transactions.map((t) =>
          t._id === updatedOrNewTransaction._id ? updatedOrNewTransaction : t
        )
      );
    } else {
      
      setTransactions([updatedOrNewTransaction, ...transactions]);
    }
    setIsFormVisible(false);
    setTransactionToEdit(null);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const searchTermMatch =
        t.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const typeMatch = filters.type === "all" || t.type === filters.type;
      return searchTermMatch && typeMatch;
    });
  }, [transactions, filters]);

  if (loading)
    return <div className="loading-spinner">Loading Transactions...</div>;

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1>Transactions</h1>
        <button onClick={handleAddNew} className="btn-primary">
          Add Transaction
        </button>
      </div>

      <div className="filters-container card">
        <input
          type="text"
          name="searchTerm"
          placeholder="Search by title or category..."
          value={filters.searchTerm}
          onChange={handleFilterChange}
        />
        <select name="type" value={filters.type} onChange={handleFilterChange}>
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <div className="transactions-list card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx) => (
              <tr key={tx._id}>
                <td>{new Date(tx.date).toLocaleDateString()}</td>
                <td>{tx.title}</td>
                <td>{tx.category}</td>
                <td>
                  <span className={`type-badge ${tx.type}`}>{tx.type}</span>
                </td>
                <td
                  className={
                    tx.type === "income" ? "amount-income" : "amount-expense"
                  }
                >
                  Rs {tx.amount.toFixed(2)}
                </td>
                <td>
                  <button onClick={() => handleEdit(tx)} className="btn-icon">
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(tx._id)}
                    className="btn-icon"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTransactions.length === 0 && (
          <p className="no-data">No transactions found.</p>
        )}
      </div>

      {isFormVisible && (
        <TransactionForm
          transactionToEdit={transactionToEdit}
          onFormSubmit={handleFormSubmit}
          onCancel={() => setIsFormVisible(false)}
        />
      )}
    </div>
  );
};

export default TransactionsPage;
