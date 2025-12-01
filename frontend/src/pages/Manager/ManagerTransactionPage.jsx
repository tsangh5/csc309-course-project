import React, { useState, useEffect } from 'react';
import AllTransactionHistory from './ManagerComponents/AllTransactionHistory';
import AllTransactionDetails from './ManagerComponents/AllTransactionDetails';
import './ManagerTransactionPage.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

const ManagerTransactionPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [loading, setLoading] = useState(true);

    const getToken = () => localStorage.getItem('token');

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${backendUrl}/transactions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch transactions');

            const data = await response.json();
            const results = Array.isArray(data) ? data : (data.results || []);
            setTransactions(results);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleTransactionSelect = (transaction) => {
        setSelectedTransaction(transaction);
    };

    const handleBack = () => {
        setSelectedTransaction(null);
    };

    const handleUpdate = () => {
        fetchTransactions();
        if (selectedTransaction) {
            const token = getToken();
            fetch(`${backendUrl}/transactions/${selectedTransaction.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(data => setSelectedTransaction(data))
                .catch(err => console.error(err));
        }
    };

    return (
        <div className="manager-transaction-page">
            <h1>Transaction Management</h1>
            {loading && <p>Loading...</p>}

            {!loading && (
                <div className={`transaction-content ${selectedTransaction ? 'split-view' : 'centered-view'}`}>

                    <div className="history-pane">
                        <AllTransactionHistory
                            transactions={transactions}
                            onTransactionSelect={handleTransactionSelect}
                        />
                    </div>

                    {selectedTransaction && (
                        <div className="details-pane">
                            <AllTransactionDetails
                                transaction={selectedTransaction}
                                onClose={() => setSelectedTransaction(null)}
                                onUpdate={handleUpdate}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ManagerTransactionPage;
