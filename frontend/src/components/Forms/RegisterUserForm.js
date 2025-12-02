import React, { useState } from 'react';
import './RegisterUserForm.css';

const RegisterUserForm = ({ onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        utorid: '',
        name: '',
        email: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const token = localStorage.getItem('token');
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

        try {
            const response = await fetch(`${backendUrl}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to register user');
            }

            if (onSuccess) {
                onSuccess(data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="register-user-form" onSubmit={handleSubmit}>
            <h2>Register New User</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
                <label htmlFor="utorid">UTORid</label>
                <input
                    type="text"
                    id="utorid"
                    name="utorid"
                    value={formData.utorid}
                    onChange={handleChange}
                    required
                    pattern="^[a-zA-Z0-9]{7,8}$"
                    title="UTORid must be 7-8 alphanumeric characters"
                />
            </div>

            <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    maxLength={50}
                />
            </div>

            <div className="form-group">
                <label htmlFor="email">UofT Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    pattern="^[A-Za-z0-9.-]+@mail\.utoronto\.ca$"
                    title="Must be a valid @mail.utoronto.ca email"
                />
            </div>

            <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={onCancel} disabled={loading}>
                    Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Registering...' : 'Register User'}
                </button>
            </div>
        </form>
    );
};

export default RegisterUserForm;
