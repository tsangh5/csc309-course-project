import React from 'react';
import { Link } from 'react-router-dom';
import { authHelper } from '../../utils/authHelper';
import './ManagerDashboard.css';
import './ManagerPages.css'

const ManagerDashboard = () => {

    const user = authHelper();
    const role = user.role;

    return (
        <div className="manager-dashboard">
            <h1>Select which Dashboard you want to access</h1>
            {role === "manager" || role === "superuser" ? (
                <div className="manager-dashboard-actions">
                    <Link to="/users" className="manager-dashboard-card">
                        <h3>User Dashboard</h3>
                        <p>Access the User Dashboard</p>
                    </Link>
                    <Link to="/transactions" className="manager-dashboard-card">
                        <h3>Transaction Dashboard</h3>
                        <p>Access the Transaction Dashboard</p>
                    </Link>
                </div>
            ) : null}
        </div>
    );
};

export default ManagerDashboard;
