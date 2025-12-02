import React from 'react';
import { Link } from 'react-router-dom';
import './Cashier.css';
import { authHelper } from '../../utils/authHelper';

const CashierDashboard = () => {
    const user = authHelper();
    const role = user.role;
    return (
        <div className="cashier-dashboard">
            <h1>Cashier Dashboard</h1>
            {role === "cashier" || role === "manager" || role === "superuser" ? (
                <div className="cashier-dashboard-actions">
                    <Link to="/cashier/create-transaction" className="cashier-dashboard-card">
                        <h3>Create Transaction</h3>
                        <p>Record a new purchase for a user.</p>
                    </Link>
                    <Link to="/cashier/process-redemption" className="cashier-dashboard-card">
                        <h3>Process Redemption</h3>
                        <p>Process a redemption request by ID.</p>
                    </Link>
                    <Link to="/cashier/register-user" className="cashier-dashboard-card">
                        <h3>Register User</h3>
                        <p>Create a new user account.</p>
                    </Link>
                </div>
            ) : null}
        </div>
    );
};

export default CashierDashboard;
