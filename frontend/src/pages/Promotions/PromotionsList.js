import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { authHelper } from '../../utils/authHelper.js';
import PromotionCard from './PromotionCard';
import './Promotions.css';

const PromotionsList = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        name: '',
        type: '',
        started: '',
        ended: '',
        orderBy: 'id',
        order: 'asc'
    });

    const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

    useEffect(() => {
        const decoded = authHelper();
        if (decoded) {
            setUserRole(decoded.role?.toLowerCase());
        }
    }, []);

    const fetchPromotions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                page,
                limit: 10,
                ...filters
            });

            // Remove empty filters
            ['name', 'type', 'started', 'ended'].forEach(key => {
                if (!filters[key]) queryParams.delete(key);
            });

            const response = await fetch(`${BASE_URL}/promotions?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch promotions: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            setPromotions(data.results);
            setTotalPages(Math.ceil(data.count / 10));
        } catch (err) {
            console.log(err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [page, filters, BASE_URL]);

    useEffect(() => {
        fetchPromotions();
    }, [fetchPromotions]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1); // Reset to first page on filter change
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this promotion?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/promotions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchPromotions();
            } else {
                alert('Failed to delete promotion');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting promotion');
        }
    };

    const isManager = userRole === 'manager' || userRole === 'superuser';

    return (
        <div className="promotions-container">
            <div className="promotions-header">
                <h2>Promotions</h2>
                {isManager && (
                    <Link to="/promotions/new" className="btn btn-primary">
                        Create New Promotion
                    </Link>
                )}
            </div>

            <div className="filters-section">
                <input
                    type="text"
                    name="name"
                    placeholder="Search by name..."
                    value={filters.name}
                    onChange={handleFilterChange}
                />
                <select name="type" value={filters.type} onChange={handleFilterChange}>
                    <option value="">All Types</option>
                    <option value="automatic">Automatic</option>
                    <option value="onetime">One-time</option>
                </select>

                <select name="orderBy" value={filters.orderBy} onChange={handleFilterChange}>
                    <option value="id">ID</option>
                    <option value="name">Name</option>
                    <option value="startTime">Start Time</option>
                    <option value="endTime">End Time</option>
                    <option value="points">Points</option>
                    <option value="rate">Rate</option>
                </select>

                <select name="order" value={filters.order} onChange={handleFilterChange}>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                </select>

                {isManager && (
                    <>
                        <select name="started" value={filters.started} onChange={handleFilterChange}>
                            <option value="">Start Status</option>
                            <option value="true">Started</option>
                            <option value="false">Not Started</option>
                        </select>
                        <select name="ended" value={filters.ended} onChange={handleFilterChange}>
                            <option value="">End Status</option>
                            <option value="true">Ended</option>
                            <option value="false">Not Ended</option>
                        </select>
                    </>
                )}
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p className="error-message">{error}</p>
            ) : (
                <>
                    <div className="promotions-grid">
                        {promotions.map(promo => (
                            <PromotionCard
                                key={promo.id}
                                promotion={promo}
                                canEdit={isManager}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>

                    <div className="pagination">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </button>
                        <span>Page {page} of {totalPages}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default PromotionsList;
