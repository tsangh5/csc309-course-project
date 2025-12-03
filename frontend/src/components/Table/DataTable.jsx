import React, { useState, useEffect, useMemo } from 'react';
import './DataTable.css';
import '../Details.css';

const DataTable = ({
    title,
    data = [],
    columns = [],
    filters = [],
    searchKeys = [],
    pageSize = 10,
    onRowClick,
    error,
    actions
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);

    const [activeFilters, setActiveFilters] = useState(() => {
        const initial = {};
        filters.forEach(f => initial[f.key] = 'all');
        return initial;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeFilters]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleFilterChange = (key, value) => {
        setCurrentPage(1);
        setActiveFilters(prev => ({ ...prev, [key]: value }));
    };

    const processedData = useMemo(() => {
        let processed = [...data];

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            processed = processed.filter(row =>
                searchKeys.some(key => {
                    const val = row[key];
                    return val && val.toString().toLowerCase().includes(lowerQuery);
                })
            );
        }

        Object.keys(activeFilters).forEach(filterKey => {
            const filterValue = activeFilters[filterKey];
            if (filterValue !== 'all') {
                const filterConfig = filters.find(f => f.key === filterKey);

                if (filterConfig && filterConfig.customFilter) {
                    processed = processed.filter(row => filterConfig.customFilter(row, filterValue));
                } else {
                    processed = processed.filter(row => String(row[filterKey]) === String(filterValue));
                }
            }
        });

        if (sortConfig.key) {
            processed.sort((a, b) => {
                const colDef = columns.find(c => c.key === sortConfig.key);

                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (colDef && colDef.getValue) {
                    aValue = colDef.getValue(a);
                    bValue = colDef.getValue(b);
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processed;
    }, [data, searchQuery, activeFilters, sortConfig, columns, filters, searchKeys]);

    const totalPages = Math.ceil(processedData.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return processedData.slice(start, start + pageSize);
    }, [processedData, currentPage, pageSize]);

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    return (
        <div className="datatable-card">
            <div className="datatable-header">
                <div className="datatable-header-top">
                    {title && <h2 className="datatable-title">{title}</h2>}

                    <div className="datatable-search-container">
                        <input
                            type="text"
                            className="datatable-search-input"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="datatable-header-bottom">
                    <div className="datatable-controls">
                        {filters.map(filter => (
                            <select
                                key={filter.key}
                                className="datatable-select"
                                value={activeFilters[filter.key]}
                                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            >
                                <option value="all">{filter.label}</option>
                                {filter.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ))}
                    </div>
                    {actions && (
                        <div className="datatable-actions">
                            {actions}
                        </div>
                    )}
                </div>
            </div>

            <div className="datatable-content">
                <table className="datatable-table">
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.key || col.label}
                                    onClick={() => col.sortable !== false && handleSort(col.key)}
                                    style={{ cursor: col.sortable !== false ? 'pointer' : 'default' }}
                                >
                                    {col.label}
                                    {col.sortable !== false && getSortIndicator(col.key)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, index) => (
                                <tr key={row.id || index} onClick={() => onRowClick && onRowClick(row)}>
                                    {columns.map(col => (
                                        <td key={`${row.id}-${col.key || col.label}`}>
                                            {/* Use render function if provided, else raw value */}
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={columns.length} className="datatable-empty-state">No records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {!error && processedData.length > 0 && (
                <div className="datatable-pagination">
                    <span>Showing {Math.min((currentPage - 1) * pageSize + 1, processedData.length)} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} entries</span>
                    <button className="datatable-page-btn" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</button>
                    <button className="datatable-page-btn" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
                </div>
            )}
        </div>
    );
};

export default DataTable;