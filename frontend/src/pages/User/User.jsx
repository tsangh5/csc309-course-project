import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvailablePoints from './UserComponents/AvailablePoints';
import QRCode from './UserComponents/QRCode';
import Transfer from './UserComponents/Transfer';
import Redemption from './UserComponents/PointRedemption';
import TransactionHistory from './UserComponents/TransactionHistory';
import TransactionDetailPanel from './UserComponents/TransactionDetails';
import './User.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

const User = () => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [transactions, setTransactions] = useState([]);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                if (!token) {
                    setToken(null);
                    navigate('/login');
                    return;
                }
                const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
                const response = await fetch(`${baseUrl}/users/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 401 || response.status === 403) {
                    navigate('/login');
                    return;
                }

                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }

                const data = await response.json();
                setUser(data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchUser();
    }, [navigate, token]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch(`${backendUrl}/users/me/transactions`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch transactions');
                }

                const data = await response.json();
                setTransactions(data.results || []);
            } catch (err) {
                console.error(err);
            }
        };

        if (token) {
            fetchTransactions();
        }
    }, [token]);

    return (
        <div className="user-dashboard-container">
            <h2 className="user-dashboard-title">User Dashboard</h2>
            {user && (
                <>
                    <AvailablePoints points={user.points} />
                    <QRCode data={user.utorid} label="Scan to Show Information" description="Show this code to the cashier" />
                    <Transfer token={token} />
                    <Redemption token={token} />
                    <TransactionHistory transactions={transactions} currentUtorid={user.utorid} onTransactionSelect={setSelectedTransaction} />
                    <TransactionDetailPanel transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
                </>
            )}
        </div>
    );
};

export default User;
