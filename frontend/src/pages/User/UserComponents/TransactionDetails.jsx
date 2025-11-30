import React from 'react';
import './TransactionDetails.css';
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
                            <span className="tdp-label">Created By</span>
                            <span className="tdp-value">{transaction.createdBy || 'System'}</span>
                        </div>

                        {transaction.type === 'purchase' && (
                            <div className="tdp-row">
                                <span className="tdp-label">Amount Spent</span>
                                <span className="tdp-value">${(transaction.spent || 0).toFixed(2)}</span>
                            </div>
                        )}

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

export default TransactionDetailPanel;