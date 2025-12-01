import React, { useState, useEffect } from 'react';
import './UserDetail.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

const UserDetail = ({ user, onClose, onUpdate, editMode, setEditMode }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(user);

    useEffect(() => {
        setFormData(user);
    }, [user]);

    const getToken = () => localStorage.getItem('token');

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const token = getToken();

            const updates = {};
            if (formData.role !== user.role) updates.role = formData.role;
            if (formData.verified !== user.verified) updates.verified = formData.verified;
            if (formData.suspicious !== user.suspicious) updates.suspicious = formData.suspicious;
            if (formData.email !== user.email) updates.email = formData.email;

            if (Object.keys(updates).length === 0) {
                setEditMode(false);
                return;
            }

            const response = await fetch(`${backendUrl}/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    role: formData.role,
                    verified: formData.verified,
                    suspicious: formData.suspicious,
                    email: formData.email
                })
            });

            if (!response.ok) throw new Error('Failed to update user');

            alert("User updated successfully!");
            setEditMode(false);
            onUpdate();
        } catch (error) {
            console.error(error);
            alert("Failed to update user.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getHeaderColor = (type) => {
        switch (type) {
            case 'regular': return '#059669';
            case 'cashier': return '#ea580c';
            case 'manager': return '#2563eb';
            case 'superuser': return '#4b5563';
            default: return '#1f2937';
        }
    };

    const headerColor = getHeaderColor(user.role);

    return (
        <div className="details-container">
            <div className="details-header" style={{ backgroundColor: headerColor }}>
                <div>
                    <h2 className="details-title">User Details #{user.id}</h2>
                    <p className="details-subtitle">{formatDate(user.createdAt)}</p>
                </div>
                <button className="details-close-btn" onClick={onClose} aria-label="Close details">&times;</button>
            </div>

            <div className="details-content">
                {editMode ? (
                    <div className="edit-form">
                        <div className="details-form-group">
                            <label>Name:</label>
                            <input name="name" value={formData.name} disabled />
                        </div>
                        <div className="details-form-group">
                            <label>Email:</label>
                            <input name="email" value={formData.email} onChange={handleInputChange} />
                        </div>
                        <div className="details-form-group">
                            <label>Role:</label>
                            <select name="role" value={formData.role} onChange={handleInputChange}>
                                <option value="regular">Regular</option>
                                <option value="cashier">Cashier</option>
                                <option value="manager">Manager</option>
                            </select>
                        </div>
                        <div className="details-form-group">
                            <div className="details-checkbox-group" style={{ accentColor: headerColor }}>
                                <label> Verified</label>
                                <input
                                    type="checkbox"
                                    name="verified"
                                    checked={formData.verified}
                                    onChange={handleInputChange}
                                />

                                <label> Suspicious </label>
                                <input
                                    type="checkbox"
                                    name="suspicious"
                                    checked={formData.suspicious}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <button className="details-btn-save" onClick={handleSave} disabled={loading}>Save</button>
                        <button className="details-btn-cancel" onClick={() => setEditMode(false)} disabled={loading}>Cancel</button>
                    </div>
                ) : (
                    <div className="details-details">
                        <div className="details-row">
                            <span className="details-label">UTORid</span>
                            <span className="details-value">{user.utorid}</span>
                        </div>
                        <div className="details-row">
                            <span className="details-label">Name</span>
                            <span className="details-value">{user.name}</span>
                        </div>
                        <div className="details-row">
                            <span className="details-label">Email</span>
                            <span className="details-value">{user.email}</span>
                        </div>
                        <div className="details-row">
                            <span className="details-label">Role</span>
                            <span className="details-value">{user.role}</span>
                        </div>
                        <div className="details-row">
                            <span className="details-label">Points</span>
                            <span className="details-value">{user.points}</span>
                        </div>
                        <div className="details-row">
                            <span className="details-label">Verified</span>
                            <span className="details-value">{user.verified ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="details-row">
                            <span className="details-label">Suspicious</span>
                            <span className="details-value">{user.suspicious ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="details-row">
                            <span className="details-label">Last Login</span>
                            <span className="details-value">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</span>
                        </div>
                        <button className="details-btn-primary" onClick={() => setEditMode(true)}>Edit User</button>
                    </div>
                )}
            </div>
        </div >
    );
};

export default UserDetail;
