import React, { useState } from 'react';
import './PointRedemption.css';

const PointRedemption = ({ token, className }) => {
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });
        setIsLoading(true);

        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

        try {
            const pointsNum = parseInt(amount, 10);

            if (isNaN(pointsNum) || pointsNum <= 0) {
                throw new Error('Amount must be a positive integer.');
            }

            const response = await fetch(`${backendUrl}/users/me/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'redemption',
                    amount: pointsNum,
                    remark: remark
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Redemption request failed');
            }

            setStatus({ type: 'success', message: `Redemption request for ${pointsNum} points submitted successfully!` });
            setAmount('');
            setRemark('');

        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`pr-container ${className || ''}`}>
            <h2 className="pr-header">Redeem Points</h2>

            {status.message && (
                <div className={`pr-status ${status.type === 'error' ? 'pr-status-error' : 'pr-status-success'}`}>
                    {status.message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="pr-form-group">
                    <label htmlFor="amount" className="pr-label">
                        Points to Redeem
                    </label>
                    <input
                        id="amount"
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 500"
                        className="pr-input"
                        required
                    />
                </div>

                <div className="pr-form-group">
                    <label htmlFor="remark" className="pr-label">
                        Remark <span style={{ fontWeight: 'normal', color: '#9ca3af' }}>(Optional)</span>
                    </label>
                    <textarea
                        id="remark"
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="Reason for redemption..."
                        rows="2"
                        className="pr-input pr-textarea"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="pr-button"
                >
                    {isLoading ? 'Processing...' : 'Request Redemption'}
                </button>
            </form>
        </div>
    );
};

export default PointRedemption;