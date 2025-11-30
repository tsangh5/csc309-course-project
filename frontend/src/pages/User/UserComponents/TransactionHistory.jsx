import React, { useState, useEffect, useMemo } from 'react';
import './TransactionHistory.css';

const ITEMS_PER_PAGE = 10;

const TransactionHistory = ({ transactions, onTransactionSelect, error }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);

    const [filterType, setFilterType] = useState('all');
    const [filterFlow, setFilterFlow] = useState('all');

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterType, filterFlow]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const processedData = useMemo(() => {
        let data = [...transactions];

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            data = data.filter((tx) =>
                tx.id.toString().includes(lowerQuery) ||
                tx.type.toLowerCase().includes(lowerQuery) ||
                (tx.remark && tx.remark.toLowerCase().includes(lowerQuery))
            );
        }

        if (filterType !== 'all') {
            data = data.filter((tx) => tx.type === filterType);
        }

        if (filterFlow !== 'all') {
            data = data.filter((tx) => {
                const amount = tx.amount || 0;
                if (filterFlow === 'in') return amount >= 0;
                if (filterFlow === 'out') return amount < 0;
                return true;
            });
        }

        if (sortConfig.key) {
            data.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'points') {
                    aValue = a.amount || 0;
                    bValue = b.amount || 0;
                } else if (sortConfig.key === 'createdAt') {
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
                } else if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [transactions, searchQuery, sortConfig, filterType, filterFlow]);

    const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return processedData.slice(start, start + ITEMS_PER_PAGE);
    }, [processedData, currentPage]);

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="th-card">
            <div className="th-header">
                <div className="th-header-top">
                    <h2 className="th-title">Transaction History</h2>
                    <div className="th-search-container">
                        <input
                            type="text"
                            className="th-search-input"
                            placeholder="Search by ID, type, remark..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="th-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                        </svg>
                    </div>
                </div>

                <div className="th-controls">
                    <select className="th-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="all">All Types</option>
                        <option value="purchase">Purchase</option>
                        <option value="redemption">Redemption</option>
                        <option value="transfer">Transfer</option>
                        <option value="adjustment">Adjustment</option>
                        <option value="event">Event</option>
                    </select>

                    <select className="th-select" value={filterFlow} onChange={(e) => setFilterFlow(e.target.value)}>
                        <option value="all">All Points</option>
                        <option value="in">Earned (+)</option>
                        <option value="out">Spent (-)</option>
                    </select>
                </div>
            </div>

            <div className="th-content">

                <table className="th-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('id')}>ID {getSortIndicator('id')}</th>
                            <th onClick={() => handleSort('type')}>Type {getSortIndicator('type')}</th>
                            <th onClick={() => handleSort('createdAt')}>Date {getSortIndicator('createdAt')}</th>
                            <th onClick={() => handleSort('points')}>Points {getSortIndicator('points')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((tx) => {
                                const points = tx.amount || 0;
                                return (
                                    <tr key={tx.id} onClick={() => { onTransactionSelect && onTransactionSelect(tx); console.log(tx) }}>
                                        <td>#{tx.id}</td>
                                        <td>
                                            <span className={`th-badge th-badge-${tx.type}`}>{tx.type}</span>
                                        </td>
                                        <td>{formatDate(tx.createdAt)}</td>
                                        <td>
                                            <span className={`th-points ${points >= 0 ? 'positive' : 'negative'}`}>
                                                {points > 0 ? '+' : ''}{points}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr><td colSpan="4" className="th-empty-state">No transactions found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {!error && processedData.length > 0 && (
                <div className="th-pagination">
                    <span>Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, processedData.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, processedData.length)} of {processedData.length} entries</span>
                    <button className="th-page-btn" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</button>
                    <button className="th-page-btn" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
                </div>
            )}
        </div>
    );
};

export default TransactionHistory;