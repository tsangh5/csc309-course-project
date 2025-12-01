import React from 'react';
import QRCode from './QRCode';


const TransactionDetailPanel = ({ transaction, onClose }) => {
    if (!transaction) return null;

    const frontendURL = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';

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
                            <span className="details-label">Created By</span>
                            <span className="details-value">{transaction.createdBy || 'System'}</span>
                        </div>

                        {transaction.type === 'purchase' && (
                            <div className="details-row">
                                <span className="details-label">Amount Spent</span>
                                <span className="details-value">${(transaction.spent || 0).toFixed(2)}</span>
                            </div>
                        )}

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
                                {transaction.processed === false && (
                                    <QRCode
                                        data={frontendURL + '/cashier/process-redemption/' + transaction.id}
                                        label="Scan to Process Redemption"
                                        description="Show this code to the cashier"
                                    />
                                )}
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
                    </div>

                    {transaction.remark && (
                        <div className="details-remark-box">
                            <span className="details-remark-label">Remark / Note</span>
                            <p className="details-remark-text">"{transaction.remark}"</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default TransactionDetailPanel;