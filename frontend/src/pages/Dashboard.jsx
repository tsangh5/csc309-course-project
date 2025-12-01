import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import { authHelper } from '../utils/authHelper'

const GeneralDashboard = () => {

    const user = authHelper();
    const role = user.role;

    return (
        <div className="general-dashboard">
            <h1>Select which Dashboard you want to access</h1>
            <div className="general-dashboard-actions">
                {role === "regular" || role === "cashier" || role === "manager" || role === "superuser" ? (
                    <Link to="/dashboard/user" className="general-dashboard-card">
                        <h3>User Dashboard</h3>
                        <p>Access the User Dashboard</p>
                    </Link>
                ) : null}
                {role === "cashier" || role === "manager" || role === "superuser" ? (
                    <Link to="/dashboard/cashier" className="general-dashboard-card">
                        <h3>Cashier Dashboard</h3>
                        <p>Access the Cashier Dashboard</p>
                    </Link>
                ) : null}
                {role === "manager" || role === "superuser" ? (
                    <Link to="/dashboard/manager" className="general-dashboard-card">
                        <h3>Manager Dashboard</h3>
                        <p>Access the Manager Dashboard</p>
                    </Link>
                ) : null}
                {role === "superuser" ? (
                    <Link to="/dashboard/admin" className="general-dashboard-card">
                        <h3>Admin Dashboard</h3>
                        <p>Access the Admin Dashboard</p>
                    </Link>
                ) : null}
            </div>
        </div>
    );
};

export default GeneralDashboard;
