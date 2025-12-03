import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [birthdayString, setBirthdayString] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        birthday: '',
        avatar: ''
    });

    const [passwordData, setPasswordData] = useState({
        old: '',
        new: '',
        confirm: ''
    });

    const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchUser();
    }, [token, navigate]);

    const fetchUser = async () => {
        try {
            const res = await fetch(`${BASE_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                throw new Error('Failed to fetch profile');
            }

            const data = await res.json();
            setUser(data);
            console.log(data)
            setFormData({
                name: data.name || '',
                email: data.email || '',
                birthday: data.birthday.split('T')[0] || '',
                avatar: data.avatarUrl || ''
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const payload = {};
            if (formData.name !== user.name) payload.name = formData.name;
            if (formData.email !== user.email) payload.email = formData.email;
            if (formData.birthday !== user.birthday) payload.birthday = formData.birthday;
            if (formData.avatar !== user.avatarUrl) payload.avatar = formData.avatar;

            if (Object.keys(payload).length === 0) {
                return;
            }

            const res = await fetch(`${BASE_URL}/users/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update profile');
            }

            setUser(data);
            setSuccess('Profile updated successfully');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwordData.new !== passwordData.confirm) {
            setError('New passwords do not match');
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/users/me/password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    old: passwordData.old,
                    new: passwordData.new
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update password');
            }

            setPasswordSuccess('Password updated successfully');
            setPasswordData({ old: '', new: '', confirm: '' });
        } catch (err) {
            setPasswordError(err.message);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];

        if (file) {
            setFormData(prevData => ({
                ...prevData,
                avatarFile: file
            }));
        }
        console.log(file)
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>My Profile</h1>
                <p>Manage your account settings and preferences</p>
            </div>

            <div className="profile-content">
                <div className="profile-card">
                    <div className="profile-avatar-section">
                        <div className="avatar-preview">
                            {formData.avatar ? (
                                <img src={formData.avatar} alt="Profile" />
                            ) : (
                                <div className="avatar-placeholder">
                                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                            )}
                        </div>
                        <div className="user-identity">
                            <h2>{user?.utorid}</h2>
                            <span className="role-badge">{user?.role}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="profile-form">
                        <h3>Personal Information</h3>

                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleProfileChange}
                                placeholder="Enter your name"
                            />
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleProfileChange}
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="form-group">
                            <label>Birthday</label>
                            <input
                                type="date"
                                name="birthday"
                                value={formData.birthday}
                                onChange={handleProfileChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Avatar URL</label>
                            <input
                                type="file"
                                name="avatar"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>

                        <button type="submit" className="save-btn">Save Changes</button>
                        {success && <div className="success-message">{success}</div>}
                        {error && <div className="error-message">{error}</div>}

                    </form>
                </div>

                <div className="password-card">
                    <form onSubmit={handleSavePassword} className="password-form">
                        <h3>Change Password</h3>

                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                name="old"
                                value={passwordData.old}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                name="new"
                                value={passwordData.new}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                            />
                            <small>Must be 8-20 characters with uppercase, lowercase, number, and special char.</small>
                        </div>

                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                name="confirm"
                                value={passwordData.confirm}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                            />
                        </div>

                        <button type="submit" className="save-btn">Update Password</button>
                        {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
                        {passwordError && <div className="error-message">{passwordError}</div>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
