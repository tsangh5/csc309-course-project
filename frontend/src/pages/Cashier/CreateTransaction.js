import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { useParams, Link } from 'react-router-dom';
import './Cashier.css';

const CreateTransaction = () => {
    const { id } = useParams();
    const [formData, setFormData] = useState({
        utorid: id || '',
        spent: '',
        remark: '',
        promotionIds: ''
    });
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        try {
            const payload = {
                type: 'purchase',
                utorid: formData.utorid,
                spent: parseFloat(formData.spent),
                remark: formData.remark,
                promotionIds: formData.promotionIds
                    ? formData.promotionIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                    : []
            };

            await apiClient.post('/transactions', payload);
            setMessage('Transaction created successfully!');
            setFormData({ utorid: '', spent: '', remark: '', promotionIds: '' });
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="cashier-container">
            <h2>Create Purchase Transaction</h2>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>User UTORid</label>
                    <input
                        type="text"
                        name="utorid"
                        value={formData.utorid}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Amount Spent ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        name="spent"
                        value={formData.spent}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Promotion IDs (comma separated, optional)</label>
                    <input
                        type="text"
                        name="promotionIds"
                        value={formData.promotionIds}
                        onChange={handleChange}
                        placeholder="e.g. 1, 2"
                    />
                </div>
                <div className="form-group">
                    <label>Remark (Optional)</label>
                    <textarea
                        name="remark"
                        value={formData.remark}
                        onChange={handleChange}
                    />
                </div>
                <button type="submit" className="btn btn-primary">Create Transaction</button>
            </form>
        </div>
    );
};

export default CreateTransaction;
