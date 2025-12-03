import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authHelper } from '../../utils/authHelper';
import './Events.css';
import { FaRegTrashAlt, FaCoins } from "react-icons/fa";

const EventPeople = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('guests');
    const [guests, setGuests] = useState([]);
    const [organizers, setOrganizers] = useState([]);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [utoridToAdd, setUtoridToAdd] = useState('');
    const [actionError, setActionError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(null);

    const [user] = useState(authHelper());
    const isManager = user && (user.role === 'manager' || user.role === 'superuser');
    const isOrganizer = user && event && event.organizers.some(o => o.id === user.id);

    const BASE_URL = process.env.REACT_APP_BACKEND_URL;

    const getHeaders = () => {
        const headers = {
            'Content-Type': 'application/json',
        };
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/events/${id}`, {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch event details');
            }

            const data = await response.json();
            setEvent(data);
            setGuests(data.guests || []);
            setOrganizers(data.organizers || []);
        } catch (err) {
            setError('Failed to load data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleAddPerson = async (e) => {
        e.preventDefault();
        setActionError(null);
        setActionSuccess(null);

        if (!utoridToAdd.trim()) return;

        const endpoint = activeTab === 'organizers'
            ? `${BASE_URL}/events/${id}/organizers`
            : `${BASE_URL}/events/${id}/guests`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ utorid: utoridToAdd }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to add user');
            }

            setActionSuccess(`User ${utoridToAdd} added successfully.`);
            setUtoridToAdd('');
            fetchData();
        } catch (err) {
            setActionError(err.message);
        }
    };

    const handleRemovePerson = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this user?')) return;

        const endpoint = activeTab === 'organizers'
            ? `${BASE_URL}/events/${id}/organizers/${userId}`
            : `${BASE_URL}/events/${id}/guests/${userId}`;

        try {
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: getHeaders(),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to remove user');
            }

            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleAwardPoints = async (userId) => {
        const points = prompt("Enter points to award:");
        if (!points) return;

        const pointsNum = parseInt(points, 10);
        if (isNaN(pointsNum) || pointsNum <= 0) {
            alert("Please enter a valid positive number.");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/events/${id}/guests/${userId}/points`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ points: pointsNum }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to award points');
            }

            alert(`Successfully awarded ${pointsNum} points.`);
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <main className="events-container">
            <header className="events-header">
                <h1>Manage People: {event?.name}</h1>
                <Link to="/events" className="back-link">← Back to Events</Link>
            </header>

            <nav className="tabs">
                <button
                    className={`tab-btn ${activeTab === 'guests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('guests')}
                >
                    Guests ({guests.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'organizers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('organizers')}
                >
                    Organizers ({organizers.length})
                </button>
            </nav>

            <section className="guest-management">
                <section className="add-guest-section">
                    <h3>Add {activeTab === 'guests' ? 'Guest' : 'Organizer'}</h3>
                    {(activeTab === 'guests' || isManager) && (
                        <form onSubmit={handleAddPerson} className="add-guest-form">
                            <input
                                type="text"
                                placeholder="Enter UTORid"
                                value={utoridToAdd}
                                onChange={(e) => setUtoridToAdd(e.target.value)}
                                className="input-field"
                            />
                            <button type="submit" className="btn-create">Add</button>
                        </form>
                    )}
                    {(!isManager && activeTab === 'organizers') && <p>Only managers can add organizers.</p>}

                    {actionError && <div className="error-message">{actionError}</div>}
                    {actionSuccess && <div className="success-message">{actionSuccess}</div>}

                    {activeTab === 'guests' && (
                        <div className="points-info">
                            <h4>Points Remaining: {event?.pointsRemain}</h4>
                        </div>
                    )}
                </section>

                <section className="guest-list-section">
                    <h3>{activeTab === 'guests' ? 'Guest List' : 'Organizer List'}</h3>
                    <ul className="guest-list">
                        {(activeTab === 'guests' ? guests : organizers).map(person => (
                            <li key={person.id} className="guest-item">
                                <span className="guest-info">
                                    <strong>{person.name}</strong> ({person.utorid})
                                    {activeTab === 'guests' && person.pointsAwarded > 0 && (
                                        <span className="points-badge">+{person.pointsAwarded} pts</span>
                                    )}
                                </span>
                                <div className="guest-actions">
                                    {activeTab === 'guests' && (isManager || isOrganizer) && (
                                        <button
                                            onClick={() => handleAwardPoints(person.id)}
                                            className="btn-icon points"
                                            title="Award Points"
                                        >
                                            <FaCoins />
                                        </button>
                                    )}
                                    {isManager && (
                                        <button
                                            onClick={() => handleRemovePerson(person.id)}
                                            className="btn-icon delete"
                                            title="Remove"
                                        >
                                            <FaRegTrashAlt />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </section>
        </main>
    );
};

export default EventPeople;
