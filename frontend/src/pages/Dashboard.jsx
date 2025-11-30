import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const GeneralDashboard = () => {
    return (
        <div className="general-dashboard">
            <h1>Select which Dashboard you want to access</h1>
            <div className="general-dashboard-actions">
                <Link to="/dashboard/user" className="general-dashboard-card">
                    <h3>User Dashboard</h3>
                    <p>Access the User Dashboard</p>
                </Link>
                <Link to="/dashboard/cashier" className="general-dashboard-card">
                    <h3>Cashier Dashboard</h3>
                    <p>Access the Cashier Dashboard</p>
                </Link>
            </div>
        </div>
    );
};

export default GeneralDashboard;
