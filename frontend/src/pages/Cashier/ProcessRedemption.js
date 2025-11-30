import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import './Cashier.css';
import { useParams } from 'react-router-dom';

const ProcessRedemption = () => {
    const { id } = useParams();
    const [transactionId, setTransactionId] = useState(id);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        try {
            await apiClient.patch(`/transactions/${transactionId}/processed`, {
                processed: true
            });
            setMessage(`Transaction ${transactionId} processed successfully!`);
            setTransactionId('');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="cashier-container">
            <h2>Process Redemption Request</h2>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Transaction ID</label>
                    <input
                        type="number"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        required
                        placeholder="Enter Transaction ID"
                    />
                </div>
                <button type="submit" className="btn btn-primary">Process Redemption</button>
            </form>
        </div>
    );
};

export default ProcessRedemption;
