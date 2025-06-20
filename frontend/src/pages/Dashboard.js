import React, { useState, useEffect, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
    const [transactions, setTransactions] = useState([]);
    const [aiAdvice, setAiAdvice] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [summaryRes, transactionsRes] = await Promise.all([
                    api.get('/transactions/summary'),
                    api.get('/transactions?limit=5')
                ]);
                setSummary(summaryRes.data);
                setTransactions(transactionsRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchAdvice = async () => {
            if (transactions.length > 0) {
                try {
                    const res = await api.post('/ai/advice', { transactions });
                    setAiAdvice(res.data.advice);
                } catch (error) {
                    console.error("Failed to fetch AI advice:", error);
                    setAiAdvice("Could not retrieve AI-powered insights at this time.");
                }
            }
        };
        fetchAdvice();
    }, [transactions]);

    const categoryData = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const categories = expenses.reduce((acc, { category, amount }) => {
            acc[category] = (acc[category] || 0) + Math.abs(amount);
            return acc;
        }, {});
        
        return {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                borderColor: '#161B22',
                borderWidth: 4,
            }]
        };
    }, [transactions]);

    if (loading) return <div className="loading-spinner">Loading Dashboard...</div>;

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <section className="summary-cards">
                <div className="card balance">
                    <h4>Current Balance</h4>
                    <p>Rs {summary.balance.toFixed(2)}</p>
                </div>
                <div className="card income">
                    <h4>Total Income</h4>
                    <p>Rs {summary.income.toFixed(2)}</p>
                </div>
                <div className="card expense">
                    <h4>Total Expense</h4>
                    <p>Rs {summary.expense.toFixed(2)}</p>
                </div>
            </section>
            <section className="dashboard-main">
                <div className="chart-container card">
                    <h3>Spending by Category</h3>
                    {transactions.filter(t => t.type === 'expense').length > 0 ? (
                        <div className="chart-wrapper"> 
                            <Doughnut 
                                data={categoryData} 
                                options={{ 
                                    responsive: true, 
                                    maintainAspectRatio: false, 
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                            labels: {
                                                color: '#C9D1D9',
                                                font: { size: 14, family: "'Roboto', sans-serif" }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <p className="no-data">No expense data available.</p>
                    )}
                </div>
                <div className="ai-advice card">
                    <h3>AI Financial Advisor</h3>
                    <p>{aiAdvice || 'Analyzing your spending habits...'}</p>
                </div>
            </section>
             <section className="recent-transactions card">
                <h3>Recent Transactions</h3>
                <ul>
                    {transactions.map(tx => (
                        <li key={tx._id} className={tx.type}>
                            <span>{tx.title}</span>
                            <span>Rs {tx.amount.toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
};

export default Dashboard;
