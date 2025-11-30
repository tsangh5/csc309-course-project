import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ResetPassword.css';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const token = query.get('token') || '';

    const [utorid, setUtorid] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
            const res = await fetch(`${baseUrl}/auth/tokens${encodeURIComponent(token)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ utorid, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to reset password');
            } else {
                setMessage('Password reset successful. You can now log in.');
                navigate('/login');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2 className="login-title">Reset Password</h2>
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                    <label className="form-label" htmlFor="utorid">UTORid</label>
                    <input
                        id="utorid"
                        className="form-input"
                        type="text"
                        value={utorid}
                        onChange={(e) => setUtorid(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="password">New Password</label>
                    <input
                        id="password"
                        className="form-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="confirm">Confirm Password</label>
                    <input
                        id="confirm"
                        className="form-input"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />
                </div>
                <button className="login-button" type="submit" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>
            </form>
        </div>
    );
};

export default ResetPassword;
