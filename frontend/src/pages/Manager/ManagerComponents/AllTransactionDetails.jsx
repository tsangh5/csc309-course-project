import React, { useState } from 'react';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const AllTransactionDetails = ({ transaction, onClose, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentRemark, setAdjustmentRemark] = useState('');

    if (!transaction) return null;

    const getToken = () => localStorage.getItem('token');

    const handleMarkSuspicious = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const newSuspiciousStatus = !transaction.suspicious;
            const response = await fetch(`${backendUrl}/transactions/${transaction.id}/suspicious`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ suspicious: newSuspiciousStatus })
            });

            if (!response.ok) throw new Error('Failed to update suspicious status');

            onUpdate();
        } catch (error) {
            console.error(error);
            alert("Failed to update suspicious status.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdjustment = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const token = getToken();
            const response = await fetch(`${backendUrl}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'adjustment',
                    amount: Number(adjustmentAmount),
                    remark: adjustmentRemark,
                    utorid: transaction.user?.utorid
                })
            });

            if (!response.ok) throw new Error('Failed to create adjustment');

            setAdjustmentAmount('');
            setAdjustmentRemark('');
            alert("Adjustment transaction created.");
            onUpdate();
        } catch (error) {
            console.error(error);
            alert("Failed to create adjustment.");
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
            case 'purchase': return '#9b0081ff';
            case 'redemption': return '#ea580c';
            case 'transfer': return '#2563eb';
            case 'adjustment': return '#4b5563';
            case 'event': return '#0098a9ff';
            default: return '#1f2937';
        }
    };

    const headerColor = getHeaderColor(transaction.type);
    const amount = transaction.amount || 0;
    const isPositive = amount >= 0;

    return (
        <>
            <div className="details-card">
                <div className="details-header" style={{ backgroundColor: headerColor }}>
                    <div>
                        <h2 className="details-title">{transaction.type}</h2>
                        <p className="details-subtitle">{formatDate(transaction.createdAt)}</p>
                    </div>
                    <button className="details-close-btn" onClick={onClose} aria-label="Close details">&times;</button>
                </div>

                <div className="details-content">
                    {transaction.suspicious && (
                        <div className="details-warning">
                            <span>⚠️</span> This transaction was flagged as suspicious.
                        </div>
                    )}

                    <div className="details-amount-section">
                        <div className="details-amount-label">Impact on Balance</div>
                        <div className="details-amount-value" style={{ color: isPositive ? '#059669' : '#dc2626' }}>
                            {isPositive ? '+' : ''}{amount.toLocaleString()} <span style={{ fontSize: '1rem', color: '#6b7280' }}>pts</span>
                        </div>
                    </div>

                    <div className="details-details">
                        <div className="details-row">
                            <span className="details-label">Transaction ID</span>
                            <span className="details-value">#{transaction.id}</span>
                        </div>

                        <div className="details-row">
                            <span className="details-label">User ID</span>
                            <span className="details-value">{transaction.utorid}</span>
                        </div>

                        <div className="details-row">
                            <span className="details-label">Created By</span>
                            <span className="details-value">{transaction.createdBy || 'System'}</span>
                        </div>

                        {transaction.type === 'purchase' && (
                            <div className="details-row">
                                <span className="details-label">Amount Spent</span>
                                <span className="details-value">${(transaction.spent || 0).toFixed(2)}</span>
                            </div>
                        )}

                        <div className="details-row">
                            <span className="details-label">Status</span>
                            <span className="details-value">{transaction.suspicious ? 'Suspicious' : 'OK'}</span>
                        </div>

                        {transaction.type === 'transfer' && (
                            <>
                                <div className="details-row">
                                    <span className="details-label">Sender</span>
                                    <span className="details-value">{transaction.sender || 'N/A'}</span>
                                </div>
                                <div className="details-row">
                                    <span className="details-label">Recipient</span>
                                    <span className="details-value">{transaction.recipient || 'N/A'}</span>
                                </div>
                            </>
                        )}

                        {transaction.type === 'redemption' && (
                            <>
                                <div className="details-row">
                                    <span className="details-label">Status</span>
                                    <span className="details-value">
                                        {transaction.processed ? (
                                            <span className="details-badge" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Processed</span>
                                        ) : (
                                            <span className="details-badge" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>Pending</span>
                                        )}
                                    </span>
                                </div>
                            </>
                        )}

                        {transaction.relatedId && (
                            <div className="details-row">
                                <span className="details-label">Related ID</span>
                                <span className="details-value">{transaction.relatedId}</span>
                            </div>
                        )}

                        {transaction.promotionIds && transaction.promotionIds.length > 0 && (
                            <div className="details-row">
                                <span className="details-label">Promotions Applied</span>
                                <span className="details-value">
                                    {transaction.promotionIds.map(id => (
                                        <span key={id} className="details-badge" style={{ marginLeft: '4px', marginBottom: '4px' }}>
                                            #{id}
                                        </span>
                                    ))}
                                </span>
                            </div>
                        )}

                        <div className="action-section">
                            <form onSubmit={handleCreateAdjustment}>
                                <div className="details-form-group">
                                    <label>Amount (positive for award, negative for deduct):</label>
                                    <input
                                        type="number"
                                        value={adjustmentAmount}
                                        onChange={(e) => setAdjustmentAmount(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="details-form-group">
                                    <label>Remark:</label>
                                    <input
                                        type="text"
                                        value={adjustmentRemark}
                                        onChange={(e) => setAdjustmentRemark(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="details-action-btn details-btn-primary" disabled={loading} style={{ backgroundColor: headerColor }}>Create Adjustment</button>
                            </form>
                        </div>

                        <button
                            className={`details-action-btn ${transaction.suspicious ? 'details-btn-secondary' : 'details-btn-danger'}`}
                            onClick={handleMarkSuspicious}
                            disabled={loading}
                        >
                            {transaction.suspicious ? 'Mark as OK' : 'Mark as Suspicious'}
                        </button>


                    </div>

                    {transaction.remark && (
                        <div className="details-remark-box">
                            <span className="details-remark-label">Remark / Note</span>
                            <p className="details-remark-text">"{transaction.remark}"</p>
                        </div>
                    )}
                </div>
            </div >
        </>
    );
};

export default AllTransactionDetails;
