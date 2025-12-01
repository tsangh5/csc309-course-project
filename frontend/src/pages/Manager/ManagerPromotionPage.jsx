import React, { useState, useEffect } from 'react';
import PromotionHistory from './ManagerComponents/PromotionHistory';
import PromotionDetails from './ManagerComponents/PromotionDetails';
import './ManagerPromotionPage.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

const ManagerPromotionPage = () => {
    const [promotions, setPromotions] = useState([]);
    const [selectedPromotion, setSelectedPromotion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPromotionData, setNewPromotionData] = useState({
        name: '',
        type: 'automatic',
        description: '',
        startTime: '',
        endTime: '',
        rate: '',
        points: '',
        minSpending: ''
    });

    const getToken = () => localStorage.getItem('token');

    const fetchPromotions = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${backendUrl}/promotions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch promotions');

            const data = await response.json();
            const results = Array.isArray(data) ? data : (data.results || []);
            setPromotions(results);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, []);

    const handlePromotionSelect = (promotion) => {
        setSelectedPromotion(promotion);
    };

    const handleBack = () => {
        setSelectedPromotion(null);
    };

    const handleUpdate = () => {
        fetchPromotions();
        if (selectedPromotion) {
            const token = getToken();
            fetch(`${backendUrl}/promotions/${selectedPromotion.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(data => setSelectedPromotion(data))
                .catch(err => console.error(err));
        }
    };

    const handleCreatePromotion = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newPromotionData };
            if (payload.rate) payload.rate = Number(payload.rate);
            if (payload.points) payload.points = Number(payload.points);
            if (payload.minSpending) payload.minSpending = Number(payload.minSpending);

            const token = getToken();
            const response = await fetch(`${backendUrl}/promotions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to create promotion');

            alert("Promotion created successfully!");
            setShowCreateModal(false);
            setNewPromotionData({
                name: '',
                type: 'automatic',
                description: '',
                startTime: '',
                endTime: '',
                rate: '',
                points: '',
                minSpending: ''
            });
            fetchPromotions();
        } catch (error) {
            console.error(error);
            alert("Failed to create promotion.");
        }
    };

    return (
        <div className="manager-promotion-page">
            <h1>Promotion Management</h1>
            {loading && <p>Loading...</p>}

            {!loading && !selectedPromotion && (
                <>
                    <PromotionHistory
                        promotions={promotions}
                        onPromotionSelect={handlePromotionSelect}
                        onCreatePromotion={() => setShowCreateModal(true)}
                    />

                    {showCreateModal && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2>Create New Promotion</h2>
                                <form onSubmit={handleCreatePromotion}>
                                    <div className="form-group">
                                        <label>Name:</label>
                                        <input
                                            value={newPromotionData.name}
                                            onChange={e => setNewPromotionData({ ...newPromotionData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Type:</label>
                                        <select
                                            value={newPromotionData.type}
                                            onChange={e => setNewPromotionData({ ...newPromotionData, type: e.target.value })}
                                        >
                                            <option value="automatic">Automatic</option>
                                            <option value="onetime">One-time</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Description:</label>
                                        <textarea
                                            value={newPromotionData.description}
                                            onChange={e => setNewPromotionData({ ...newPromotionData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Start Time:</label>
                                        <input
                                            type="datetime-local"
                                            value={newPromotionData.startTime}
                                            onChange={e => setNewPromotionData({ ...newPromotionData, startTime: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Time:</label>
                                        <input
                                            type="datetime-local"
                                            value={newPromotionData.endTime}
                                            onChange={e => setNewPromotionData({ ...newPromotionData, endTime: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Rate (e.g., 0.1 for 10%):</label>
                                        <input
                                            type="number" step="0.01"
                                            value={newPromotionData.rate}
                                            onChange={e => setNewPromotionData({ ...newPromotionData, rate: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Points:</label>
                                        <input
                                            type="number"
                                            value={newPromotionData.points}
                                            onChange={e => setNewPromotionData({ ...newPromotionData, points: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Min Spending:</label>
                                        <input
                                            type="number"
                                            value={newPromotionData.minSpending}
                                            onChange={e => setNewPromotionData({ ...newPromotionData, minSpending: e.target.value })}
                                        />
                                    </div>
                                    <div className="modal-actions">
                                        <button type="submit" className="btn-primary">Create</button>
                                        <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}

            {!loading && selectedPromotion && (
                <PromotionDetails
                    promotion={selectedPromotion}
                    onBack={handleBack}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
};

export default ManagerPromotionPage;
