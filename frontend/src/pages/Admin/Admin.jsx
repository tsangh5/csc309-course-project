import React, { useState } from 'react';
import './Admin.css';

const Admin = () => {
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
    const getToken = () => localStorage.getItem('token');

    const handlePromote = async (role) => {
        if (!userId) {
            setError('Please enter a User ID');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const token = getToken();
            const response = await fetch(`${backendUrl}/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update user role');
            }

            setMessage(`Success! User ${userId} has been promoted to ${role}.`);
            setUserId('');
        } catch (err) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-container">
            <h1>Admin Dashboard</h1>

            <div className="admin-card">
                <h2>Role Management</h2>
                <p className="admin-description">Enter a user ID below to update their system permissions.</p>

                <div className="form-group">
                    <label htmlFor="userId">User ID</label>
                    <input
                        type="text"
                        id="userId"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {message && <div className="status-message success">{message}</div>}
                {error && <div className="status-message error">{error}</div>}

                <div className="button-group">
                    <button
                        className="btn-promote btn-manager"
                        onClick={() => handlePromote('manager')}
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Promote to Manager'}
                    </button>

                    <button
                        className="btn-promote btn-superuser"
                        onClick={() => handlePromote('superuser')}
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Promote to Admin'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Admin;