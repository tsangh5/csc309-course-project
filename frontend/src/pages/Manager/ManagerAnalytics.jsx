import React, { useState, useEffect } from 'react';
import { authHelper } from '../../utils/authHelper';
import './ManagerDashboard.css';
import './ManagerPages.css';
import './ManagerAnalytics.css';

// Simple SVG Bar Chart Component to replace Recharts due to React 19 compatibility issues
const SimpleBarChart = ({ data, color = "#8884d8", labelKey = "date", valueKey = "value" }) => {
    if (!data || data.length === 0) return <p>No data available</p>;

    const height = 300;
    const width = 800;
    const padding = 40;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;
    
    const maxVal = Math.max(...data.map(d => d[valueKey]), 1); // Avoid division by zero
    const barWidth = (chartWidth / data.length) * 0.6;
    const gap = (chartWidth / data.length) * 0.4;

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
            {/* Y Axis */}
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" />
            {/* X Axis */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc" />

            {/* Bars */}
            {data.map((d, i) => {
                const val = d[valueKey];
                const barHeight = (val / maxVal) * chartHeight;
                const x = padding + gap / 2 + i * (barWidth + gap);
                const y = height - padding - barHeight;
                
                return (
                    <g key={i}>
                        <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            fill={color}
                        />
                        {/* X Axis Labels */}
                        <text
                            x={x + barWidth / 2}
                            y={height - padding + 15}
                            textAnchor="middle"
                            fontSize="12"
                            fill="#666"
                        >
                            {labelKey === 'date' && typeof d[labelKey] === 'string' && d[labelKey].length > 5 ? d[labelKey].slice(5) : d[labelKey]}
                        </text>
                        {/* Value Labels */}
                        <text
                            x={x + barWidth / 2}
                            y={y - 5}
                            textAnchor="middle"
                            fontSize="12"
                            fill="#333"
                        >
                            {val}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

const ManagerAnalytics = () => {
    const user = authHelper();
    const role = user.role;
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
                const response = await fetch(`${baseUrl}/analytics`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setLoading(false);
            }
        };

        if (role === 'manager' || role === 'superuser') {
            fetchAnalytics();
        }
    }, [role]);

    if (role !== 'manager' && role !== 'superuser') {
        return <p>Access Denied</p>;
    }

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <h1>Analytics Dashboard</h1>
            </div>
            {loading ? (
                <p>Loading analytics...</p>
            ) : stats ? (
                <>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-card-header">Total Revenue</div>
                            <div className="stat-card-body">
                                <p>${stats.totalRevenue.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-header">Points Redeemed</div>
                            <div className="stat-card-body">
                                <p>{stats.totalPointsRedeemed}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-header">Total Users</div>
                            <div className="stat-card-body">
                                <p>{stats.totalNewUsers}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-header">Avg Transaction</div>
                            <div className="stat-card-body">
                                <p>${stats.avgTransactionValue.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-header">Redemption Rate</div>
                            <div className="stat-card-body">
                                <p>{stats.pointRedemptionRate.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="chart-grid">
                        <div className="chart-card chart-revenue">
                            <div className="chart-card-header">Revenue (Last 7 Days)</div>
                            <div className="chart-card-body">
                                <SimpleBarChart data={stats.revenueChartData} color="#8b5cf6" valueKey="revenue" />
                            </div>
                        </div>
                        <div className="chart-card chart-events">
                            <div className="chart-card-header">Active Events (Last 7 Days)</div>
                            <div className="chart-card-body">
                                <SimpleBarChart data={stats.eventChartData} color="#10b981" />
                            </div>
                        </div>
                        <div className="chart-card chart-redemptions">
                            <div className="chart-card-header">Points Redeemed (Last 7 Days)</div>
                            <div className="chart-card-body">
                                <SimpleBarChart data={stats.redemptionChartData} color="#f59e0b" />
                            </div>
                        </div>
                        <div className="chart-card chart-purchases">
                            <div className="chart-card-header">Purchase Count (Last 7 Days)</div>
                            <div className="chart-card-body">
                                <SimpleBarChart data={stats.purchaseCountChartData} color="#f97316" />
                            </div>
                        </div>
                        <div className="chart-card chart-hourly chart-full-width">
                            <div className="chart-card-header">Transactions by Hour (Last 30 Days)</div>
                            <div className="chart-card-body">
                                <SimpleBarChart data={stats.hourlyChartData} labelKey="label" color="#06b6d4" />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <p>Failed to load analytics data.</p>
            )}
        </div>
    );
};

export default ManagerAnalytics;
