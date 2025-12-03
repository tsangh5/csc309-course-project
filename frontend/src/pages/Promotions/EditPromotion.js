import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Promotions.css';


const EditPromotion = () => {
    const { id } = useParams();
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

    useEffect(() => {
        const fetchPromotion = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${BASE_URL}/promotions/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch promotion details');
                }

                const data = await response.json();

                // Format dates for datetime-local input
                const formatDate = (dateString) => {
                    if (!dateString) return '';
                    const date = new Date(dateString);
                    return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
                };

                setFormData({
                    name: data.name,
                    description: data.description || '',
                    type: data.type,
                    startTime: formatDate(data.startTime),
                    endTime: formatDate(data.endTime),
                    minSpending: data.minSpending || '',
                    rate: data.rate || '',
                    points: data.points || ''
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPromotion();
    }, [id]);

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
                minSpending: formData.minSpending ? parseFloat(formData.minSpending) : null,
                rate: formData.rate ? parseFloat(formData.rate) : null,
                points: formData.points ? parseInt(formData.points) : null,
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString()
            };

            const response = await fetch(`${BASE_URL}/promotions/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update promotion');
            }

            navigate('/promotions');
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="promotion-form-container">
            <h2>Edit Promotion</h2>
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

                <button type="submit" className="btn btn-primary">Update Promotion</button>
            </form>
        </div>
    );
};

export default EditPromotion;
