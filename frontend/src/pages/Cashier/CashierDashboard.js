import React from 'react';
import { Link } from 'react-router-dom';
import './Cashier.css';

const CashierDashboard = () => {
    return (
        <div className="cashier-dashboard">
            <h1>Cashier Dashboard</h1>
            <div className="dashboard-actions">
                <Link to="/cashier/create-transaction" className="dashboard-card">
                    <h3>Create Transaction</h3>
                    <p>Record a new purchase for a user.</p>
                </Link>
                <Link to="/cashier/process-redemption" className="dashboard-card">
                    <h3>Process Redemption</h3>
                    <p>Process a redemption request by ID.</p>
                </Link>
            </div>
        </div>
    );
};

export default CashierDashboard;
