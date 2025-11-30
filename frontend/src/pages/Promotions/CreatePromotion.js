import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Promotions.css';

const CreatePromotion = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'automatic',
        startTime: '',
        endTime: '',
        minSpending: '',
        rate: '',
        points: ''
    });
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                minSpending: formData.minSpending ? parseFloat(formData.minSpending) : undefined,
                rate: formData.rate ? parseFloat(formData.rate) : undefined,
                points: formData.points ? parseInt(formData.points) : undefined,
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString()
            };

            const response = await fetch('/promotions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create promotion');
            }

            navigate('/promotions');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="promotion-form-container">
            <h2>Create New Promotion</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                
                <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label>Type</label>
                    <select name="type" value={formData.type} onChange={handleChange}>
                        <option value="automatic">Automatic</option>
                        <option value="onetime">One-time</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Start Time</label>
                    <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label>End Time</label>
                    <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label>Minimum Spending (Optional)</label>
                    <input type="number" step="0.01" name="minSpending" value={formData.minSpending} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Rate (Multiplier, e.g. 1.5) (Optional)</label>
                    <input type="number" step="0.1" name="rate" value={formData.rate} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label>Points (Flat amount) (Optional)</label>
                    <input type="number" name="points" value={formData.points} onChange={handleChange} />
                </div>

                <button type="submit" className="btn btn-primary">Create Promotion</button>
            </form>
        </div>
    );
};

export default CreatePromotion;
