import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [utorid, setUtorid] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
            const response = await fetch(`${baseUrl}/auth/tokens`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ utorid, password }),
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const user = await response.json();
                    throw new Error(user.error || 'Login failed');
                } else {
                    throw new Error('Server error - please check backend connection');
                }
            }

            const user = await response.json();
            localStorage.setItem('token', user.token);
            const role = user.role;
            if (role === 'regular') {
                navigate('/dashboard/user');
            } else {
                navigate('/dashboard/');
            }
        } catch (err) {
            if (err.message === "Failed to fetch") {
                setError("Could not connect to server")
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2 className="login-title">Login</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                    <label htmlFor="utorid" className="form-label">UTORid</label>
                    <input
                        type="text"
                        id="utorid"
                        className="form-input"
                        value={utorid}
                        onChange={(e) => setUtorid(e.target.value)}
                        required
                        autoFocus
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                        type="password"
                        id="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="login-button" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <Link to="/reset-request" style={{ color: '#007bff', textDecoration: 'none' }}>Forgot password?</Link>
            </div>
        </div>
    );
};

export default Login;
