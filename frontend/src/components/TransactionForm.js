import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './TransactionForm.css';

const TransactionForm = ({ transactionToEdit, onFormSubmit, onCancel }) => {
  const initialState = {
    title: '',
    amount: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    notes: '',
  };
  
  const [transaction, setTransaction] = useState(initialState);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transactionToEdit) {
      setTransaction({
        ...transactionToEdit,
        date: new Date(transactionToEdit.date).toISOString().split('T')[0],
      });
    } else {
      setTransaction(initialState);
    }
  }, [transactionToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTransaction({ ...transaction, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transaction.title || !transaction.amount || !transaction.category || !transaction.date) {
        setError('Please fill out all required fields.');
        return;
    }
    setError('');

    try {
        let response;
        if (transaction._id) {
            response = await api.put(`/transactions/${transaction._id}`, transaction);
        } else {
            response = await api.post('/transactions', transaction);
        }
        onFormSubmit(response.data);
        setTransaction(initialState);
    } catch (err) {
        console.error('Failed to submit transaction', err);
        setError('Failed to save transaction. Please try again.');
    }
  };

  return (
    <div className="modal-overlay">
        <div className="modal-content">
            <form onSubmit={handleSubmit} className="transaction-form">
                <h2>{transaction._id ? 'Edit Transaction' : 'Add Transaction'}</h2>
                {error && <p className="error-message">{error}</p>}
                
                <div className="form-group">
                    <label>Type</label>
                    <div className="type-toggle">
                        <button type="button" className={`btn-expense ${transaction.type === 'expense' ? 'active' : ''}`} onClick={() => setTransaction({...transaction, type: 'expense'})}>Expense</button>
                        <button type="button" className={`btn-income ${transaction.type === 'income' ? 'active' : ''}`} onClick={() => setTransaction({...transaction, type: 'income'})}>Income</button>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input type="text" id="title" name="title" value={transaction.title} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label htmlFor="amount">Amount</label>
                    <input type="number" id="amount" name="amount" value={transaction.amount} onChange={handleChange} required step="0.01" />
                </div>
                
                <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <input type="text" id="category" name="category" value={transaction.category} onChange={handleChange} required />
                </div>
                
                <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input type="date" id="date" name="date" value={transaction.date} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label htmlFor="notes">Notes (Optional)</label>
                    <textarea id="notes" name="notes" value={transaction.notes} onChange={handleChange}></textarea>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary">{transaction._id ? 'Save Changes' : 'Add Transaction'}</button>
                    <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default TransactionForm;
