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
                    <Link to="/dashboard/manager/users" className="manager-dashboard-card">
                        <h3>User Management Dashboard</h3>
                        <p>Access the User Management Dashboard</p>
                    </Link>
                    <Link to="/dashboard/manager/transactions" className="manager-dashboard-card">
                        <h3>Transaction Management Dashboard</h3>
                        <p>Access the Transaction Management Dashboard</p>
                    </Link>
                </div>
            ) : null}
        </div>
    );
};

export default ManagerDashboard;
