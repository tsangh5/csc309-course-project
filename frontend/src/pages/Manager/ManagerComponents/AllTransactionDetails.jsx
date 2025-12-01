import React, { useState } from 'react';
import './AllTransactionDetails.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

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
            case 'purchase': return '#059669'; // Green
            case 'redemption': return '#ea580c'; // Orange
            case 'transfer': return '#2563eb'; // Blue
            case 'adjustment': return '#4b5563'; // Gray
            case 'event': return '#7c3aed'; // Purple
            default: return '#1f2937';
        }
    };

    const headerColor = getHeaderColor(transaction.type);
    const amount = transaction.amount || 0;
    const isPositive = amount >= 0;

    return (
        <>
            <div className="tdp-card">
                <div className="tdp-header" style={{ backgroundColor: headerColor }}>
                    <div>
                        <h2 className="tdp-title">{transaction.type}</h2>
                        <p className="tdp-subtitle">{formatDate(transaction.createdAt)}</p>
                    </div>
                    <button className="tdp-close-btn" onClick={onClose} aria-label="Close details">&times;</button>
                </div>

                <div className="tdp-content">
                    {transaction.suspicious && (
                        <div className="tdp-warning">
                            <span>⚠️</span> This transaction was flagged as suspicious.
                        </div>
                    )}

                    <div className="tdp-amount-section">
                        <div className="tdp-amount-label">Impact on Balance</div>
                        <div className="tdp-amount-value" style={{ color: isPositive ? '#059669' : '#dc2626' }}>
                            {isPositive ? '+' : ''}{amount.toLocaleString()} <span style={{ fontSize: '1rem', color: '#6b7280' }}>pts</span>
                        </div>
                    </div>

                    <div className="tdp-details">
                        <div className="tdp-row">
                            <span className="tdp-label">Transaction ID</span>
                            <span className="tdp-value">#{transaction.id}</span>
                        </div>

                        <div className="tdp-row">
                            <span className="tdp-label">User ID</span>
                            <span className="tdp-value">{transaction.utorid}</span>
                        </div>

                        <div className="tdp-row">
                            <span className="tdp-label">Created By</span>
                            <span className="tdp-value">{transaction.createdBy || 'System'}</span>
                        </div>

                        {transaction.type === 'purchase' && (
                            <div className="tdp-row">
                                <span className="tdp-label">Amount Spent</span>
                                <span className="tdp-value">${(transaction.spent || 0).toFixed(2)}</span>
                            </div>
                        )}

                        <div className="tdp-row">
                            <span className="tdp-label">Status</span>
                            <span className="tdp-value">{transaction.suspicious ? 'Suspicious' : 'OK'}</span>
                        </div>

                        {transaction.type === 'transfer' && (
                            <>
                                <div className="tdp-row">
                                    <span className="tdp-label">Sender</span>
                                    <span className="tdp-value">{transaction.sender || 'N/A'}</span>
                                </div>
                                <div className="tdp-row">
                                    <span className="tdp-label">Recipient</span>
                                    <span className="tdp-value">{transaction.recipient || 'N/A'}</span>
                                </div>
                            </>
                        )}

                        {transaction.type === 'redemption' && (
                            <>
                                <div className="tdp-row">
                                    <span className="tdp-label">Status</span>
                                    <span className="tdp-value">
                                        {transaction.processed ? (
                                            <span className="tdp-badge" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Processed</span>
                                        ) : (
                                            <span className="tdp-badge" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>Pending</span>
                                        )}
                                    </span>
                                </div>
                            </>
                        )}

                        {transaction.relatedId && (
                            <div className="tdp-row">
                                <span className="tdp-label">Related ID</span>
                                <span className="tdp-value">{transaction.relatedId}</span>
                            </div>
                        )}

                        {transaction.promotionIds && transaction.promotionIds.length > 0 && (
                            <div className="tdp-row">
                                <span className="tdp-label">Promotions Applied</span>
                                <span className="tdp-value">
                                    {transaction.promotionIds.map(id => (
                                        <span key={id} className="tdp-badge" style={{ marginLeft: '4px', marginBottom: '4px' }}>
                                            #{id}
                                        </span>
                                    ))}
                                </span>
                            </div>
                        )}

                        <div className="action-section">
                            <form onSubmit={handleCreateAdjustment}>
                                <div className="form-group">
                                    <label>Amount (positive for award, negative for deduct):</label>
                                    <input
                                        type="number"
                                        value={adjustmentAmount}
                                        onChange={(e) => setAdjustmentAmount(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Remark:</label>
                                    <input
                                        type="text"
                                        value={adjustmentRemark}
                                        onChange={(e) => setAdjustmentRemark(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading}>Create Adjustment</button>
                            </form>
                        </div>

                        <button
                            className={`action-button ${transaction.suspicious ? 'btn-secondary' : 'btn-danger'}`}
                            onClick={handleMarkSuspicious}
                            disabled={loading}
                        >
                            {transaction.suspicious ? 'Mark as OK' : 'Mark as Suspicious'}
                        </button>


                    </div>

                    {transaction.remark && (
                        <div className="tdp-remark-box">
                            <span className="tdp-remark-label">Remark / Note</span>
                            <p className="tdp-remark-text">"{transaction.remark}"</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AllTransactionDetails;
