import React, { useState } from 'react';
import './Transfer.css';

const PointTransfer = ({ token, className }) => {
    const [recipientId, setRecipientId] = useState('');
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });
        setIsLoading(true);

        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

        try {
            const userIdNum = parseInt(recipientId, 10);
            const pointsNum = parseInt(amount, 10);

            if (isNaN(userIdNum) || userIdNum <= 0) {
                throw new Error('Please enter a valid User ID (positive integer).');
            }
            if (isNaN(pointsNum) || pointsNum <= 0) {
                throw new Error('Amount must be a positive integer.');
            }

            const response = await fetch(`${backendUrl}/users/${userIdNum}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'transfer',
                    amount: pointsNum,
                    remark: remark
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Transfer failed');
            }

            setStatus({ type: 'success', message: `Successfully transferred ${pointsNum} points to User ID ${userIdNum}!` });
            setRecipientId('');
            setAmount('');
            setRemark('');
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`pt-container ${className || ''}`}>
            <h2 className="pt-header">Transfer Points</h2>

            {status.message && (
                <div className={`pt-status ${status.type === 'error' ? 'pt-status-error' : 'pt-status-success'}`}>
                    {status.message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="pt-form-group">
                    <label htmlFor="recipientId" className="pt-label">
                        Recipient User ID
                    </label>
                    <input
                        id="recipientId"
                        type="number"
                        min="1"
                        value={recipientId}
                        onChange={(e) => setRecipientId(e.target.value)}
                        placeholder="e.g. 42"
                        className="pt-input"
                        required
                    />
                </div>

                <div className="pt-form-group">
                    <label htmlFor="amount" className="pt-label">
                        Points Amount
                    </label>
                    <input
                        id="amount"
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 100"
                        className="pt-input"
                        required
                    />
                </div>

                <div className="pt-form-group">
                    <label htmlFor="remark" className="pt-label">
                        Remark <span style={{ fontWeight: 'normal', color: '#9ca3af' }}>(Optional)</span>
                    </label>
                    <textarea
                        id="remark"
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="What is this for?"
                        rows="2"
                        className="pt-input pt-textarea"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="pt-button"
                >
                    {isLoading ? 'Processing...' : 'Send Points'}
                </button>
            </form>
        </div>
    );
};

export default PointTransfer;