import React from 'react';
import { Link } from 'react-router-dom';
import { authHelper } from '../../utils/authHelper';
import './ManagerDashboard.css';
import './ManagerPages.css';

const ManagerDashboard = () => {
    const user = authHelper();
    const role = user.role;

    return (
        <div className="manager-dashboard">
            <h1>Manager Dashboard</h1>
            
            {role === "manager" || role === "superuser" ? (
                <>
                    <div className="manager-dashboard-actions">
                        <Link to="/dashboard/manager/users" className="manager-dashboard-card">
                            <h3>User Management</h3>
                            <p>Manage users and permissions</p>
                        </Link>
                        <Link to="/dashboard/manager/transactions" className="manager-dashboard-card">
                            <h3>Transaction Management</h3>
                            <p>View and manage transactions</p>
                        </Link>
                        <Link to="/dashboard/manager/analytics" className="manager-dashboard-card">
                            <h3>Analytics Dashboard</h3>
                            <p>View system analytics and reports</p>
                        </Link>
                    </div>
                </>
            ) : (
                <p>Access Denied</p>
            )}
        </div>
    );
};

export default ManagerDashboard;
