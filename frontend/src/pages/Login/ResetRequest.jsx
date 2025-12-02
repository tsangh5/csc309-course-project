import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResetRequest.css';

const ResetRequest = () => {
    const [utorid, setUtorid] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
            const res = await fetch(`${baseUrl}/auth/resets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ utorid })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to request reset');
            } else {
                navigate(`/reset-password?token=${encodeURIComponent(data.resetToken)}`);
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2 className="login-title">Password Reset</h2>
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
                <button className="login-button" type="submit" disabled={loading}>
                    {loading ? 'Requesting...' : 'Request Reset'}
                </button>
            </form>
        </div>
    );
};

export default ResetRequest;
