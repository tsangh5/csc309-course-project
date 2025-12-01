import React, { useState } from 'react';
import './UserDetail.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

const UserDetail = ({ user, onBack, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ ...user });

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

    return (
        <div className="user-detail-container">
            <button className="back-button" onClick={onBack}>&larr; Back to List</button>
            <h2>User Details #{user.id}</h2>

            {editMode ? (
                <div className="edit-form">
                    <div className="form-group">
                        <label>Name:</label>
                        <input name="name" value={formData.name} disabled />
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input name="email" value={formData.email} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Role:</label>
                        <select name="role" value={formData.role} onChange={handleInputChange}>
                            <option value="regular">Regular</option>
                            <option value="cashier">Cashier</option>
                            <option value="manager">Manager</option>
                        </select>
                    </div>
                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                name="verified"
                                checked={formData.verified}
                                onChange={handleInputChange}
                            />
                            Verified
                        </label>
                    </div>
                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                name="suspicious"
                                checked={formData.suspicious}
                                onChange={handleInputChange}
                            />
                            Suspicious
                        </label>
                    </div>

                    <button className="btn-save" onClick={handleSave} disabled={loading}>Save</button>
                    <button className="btn-cancel" onClick={() => setEditMode(false)} disabled={loading}>Cancel</button>
                </div>
            ) : (
                <div className="view-details">
                    <p><strong>UTORid:</strong> {user.utorid}</p>
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> <span className={`th-badge th-badge-${user.role}`}>{user.role}</span></p>
                    <p><strong>Points:</strong> {user.points}</p>
                    <p><strong>Verified:</strong> {user.verified ? 'Yes' : 'No'}</p>
                    <p><strong>Suspicious:</strong> {user.suspicious ? 'Yes' : 'No'}</p>
                    <p><strong>Last Login:</strong> {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
                    <p><strong>Created At:</strong> {new Date(user.createdAt).toLocaleString()}</p>

                    <div className="action-buttons">
                        <button className="btn-edit" onClick={() => setEditMode(true)}>Edit User</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDetail;
