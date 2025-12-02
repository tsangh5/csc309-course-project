import React, { useState } from 'react';
import './PromotionDetails.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const PromotionDetails = ({ promotion, onBack, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ ...promotion });

    const getToken = () => localStorage.getItem('token');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const response = await fetch(`${backendUrl}/promotions/${promotion.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to update promotion');

            alert("Promotion updated successfully!");
            setEditMode(false);
            onUpdate();
        } catch (error) {
            console.error(error);
            alert("Failed to update promotion.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this promotion?")) return;
        try {
            setLoading(true);
            const token = getToken();
            const response = await fetch(`${backendUrl}/promotions/${promotion.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete promotion');

            alert("Promotion deleted.");
            onBack();
            onUpdate();
        } catch (error) {
            console.error(error);
            alert("Failed to delete promotion.");
            setLoading(false);
        }
    };

    return (
        <div className="promotion-details-container">
            <button className="back-button" onClick={onBack}>&larr; Back to List</button>
            <h2>Promotion Details #{promotion.id}</h2>

            {editMode ? (
                <div className="edit-form">
                    <div className="form-group">
                        <label>Name:</label>
                        <input name="name" value={formData.name} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Description:</label>
                        <textarea name="description" value={formData.description || ''} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Start Time:</label>
                        <input name="startTime" type="datetime-local" value={formData.startTime ? new Date(formData.startTime).toISOString().slice(0, 16) : ''} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>End Time:</label>
                        <input name="endTime" type="datetime-local" value={formData.endTime ? new Date(formData.endTime).toISOString().slice(0, 16) : ''} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Rate:</label>
                        <input name="rate" type="number" step="0.01" value={formData.rate || ''} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Points:</label>
                        <input name="points" type="number" value={formData.points || ''} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Min Spending:</label>
                        <input name="minSpending" type="number" value={formData.minSpending || ''} onChange={handleInputChange} />
                    </div>
                    <button className="btn-save" onClick={handleSave} disabled={loading}>Save</button>
                    <button className="btn-cancel" onClick={() => setEditMode(false)} disabled={loading}>Cancel</button>
                </div>
            ) : (
                <div className="view-details">
                    <p><strong>Name:</strong> {promotion.name}</p>
                    <p><strong>Type:</strong> {promotion.type}</p>
                    <p><strong>Description:</strong> {promotion.description || 'N/A'}</p>
                    <p><strong>Start Time:</strong> {promotion.startTime ? new Date(promotion.startTime).toLocaleString() : 'N/A'}</p>
                    <p><strong>End Time:</strong> {promotion.endTime ? new Date(promotion.endTime).toLocaleString() : 'N/A'}</p>
                    <p><strong>Rate:</strong> {promotion.rate || 'N/A'}</p>
                    <p><strong>Points:</strong> {promotion.points || 'N/A'}</p>
                    <p><strong>Min Spending:</strong> {promotion.minSpending || 'N/A'}</p>

                    <div className="action-buttons">
                        <button className="btn-edit" onClick={() => setEditMode(true)}>Edit</button>
                        <button className="btn-delete" onClick={handleDelete}>Delete Promotion</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromotionDetails;
