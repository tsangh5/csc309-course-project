import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import EventCard from './EventCard';
import './Events.css';

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

const EventsPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [userRsvps, setUserRsvps] = useState(new Set());
    const [user, setUser] = useState(null);
    const [organizedEventsList, setOrganizedEventsList] = useState([]);
    const [token] = useState(localStorage.getItem('token'));

    const [filters, setFilters] = useState({
        name: '',
        orderBy: 'startTime',
        order: 'asc',
        started: '',
        ended: ''
    });

    const LIMIT = 6;
    const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const url = new URL(`${BASE_URL}/events`);
            url.searchParams.append('page', page);
            url.searchParams.append('limit', LIMIT);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: getHeaders(),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Request failed with status ${response.status}`);
            }

            const data = await response.json();
            setEvents(data.results);
            setTotalPages(Math.ceil(data.count / LIMIT));

        } catch (err) {
            setError('Failed to load events. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, BASE_URL]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents, page]);

    const handleRsvp = async (eventId) => {
        try {
            const response = await fetch(`${BASE_URL}/events/${eventId}/guests/me`, {
                method: 'POST',
                headers: getHeaders(),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to RSVP');
            }

            fetchUser();
            fetchEvents();
        } catch (err) {
            alert(err.message || 'Failed to RSVP');
        }
    };

    const fetchUser = useCallback(async () => {
        try {
            const response = await fetch(`${BASE_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const data = await response.json();
            setUser(data);
        } catch (err) {
            console.error(err);
        }
    }, [token, BASE_URL]);

    useEffect(() => {
        if (token) {
            fetchUser();
        }
    }, [fetchUser, token]);

    useEffect(() => {
        if (user && user.guestEvents) {
            const rsvps = new Set(user.guestEvents.map(ge => ge.eventId));
            setUserRsvps(rsvps);
        }
    }, [user]);

    useEffect(() => {
        const fetchEvent = async (eventId) => {
            try {
                const response = await fetch(`${BASE_URL}/events/${eventId}`, {
                    method: 'GET',
                    headers: getHeaders(),
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || `Request failed with status ${response.status}`);
                }

                const data = await response.json();
                return data;
            } catch (err) {
                setError('Failed to load event. Please try again later.');
                console.error(err);
            }
        };

        const loadOrganizedEvents = async () => {
            if (user && user.organizedEvents && user.organizedEvents.length > 0) {
                const promises = user.organizedEvents.map(oe => fetchEvent(oe.eventId));
                const eventsData = await Promise.all(promises);
                setOrganizedEventsList(eventsData.filter(e => e));
            } else {
                setOrganizedEventsList([]);
            }
        };
        loadOrganizedEvents();
    }, [user, BASE_URL]);

    const handleCancelRsvp = async (eventId) => {
        try {
            const response = await fetch(`${BASE_URL}/events/${eventId}/guests/me`, {
                method: 'DELETE',
                headers: getHeaders(),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to cancel RSVP');
            }

            fetchUser();
            fetchEvents();
        } catch (err) {
            alert(err.message || 'Failed to cancel RSVP');
        }
    };

    const handleDelete = async (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        try {
            const response = await fetch(`${BASE_URL}/events/${eventId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to delete event');
            }

            fetchEvents();
        } catch (err) {
            alert(err.message || 'Failed to delete event');
        }
    };

    const handlePrevPage = () => {
        setPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setPage(prev => Math.min(prev + 1, totalPages));
    };

    const isManager = user && (user.role === 'manager' || user.role === 'superuser');
    const canCreate = isManager;

    const filteredEvents = events.filter(event => {
        if (filters.name && !event.name.toLowerCase().includes(filters.name.toLowerCase())) {
            return false;
        }

        if (isManager) {
            if (filters.started) {
                const isStarted = new Date() >= new Date(event.startTime);
                if (filters.started === 'true' && !isStarted) return false;
                if (filters.started === 'false' && isStarted) return false;
            }
            if (filters.ended) {
                const isEnded = new Date() >= new Date(event.endTime);
                if (filters.ended === 'true' && !isEnded) return false;
                if (filters.ended === 'false' && isEnded) return false;
            }
        }
        return true;
    }).sort((a, b) => {
        const { orderBy, order } = filters;
        const multiplier = order === 'asc' ? 1 : -1;

        let valA = a[orderBy];
        let valB = b[orderBy];

        if (orderBy === 'startTime' || orderBy === 'endTime') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        } else if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return -1 * multiplier;
        if (valA > valB) return 1 * multiplier;
        return 0;
    });

    if (loading && events.length === 0) return <div className="loading">Loading events...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="events-container">
            <div className="events-header">
                <div className="header-content">
                    <h1>Upcoming Events</h1>
                    <p>Discover and join exclusive events happening near you.</p>
                </div>

                {canCreate && (
                    <div className="header-actions">
                        <Link to="/events/new" className="btn btn-primary">
                            Create Event
                        </Link>
                    </div>
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
                <select name="orderBy" value={filters.orderBy} onChange={handleFilterChange}>
                    <option value="id">ID</option>
                    <option value="name">Name</option>
                    <option value="startTime">Start Time</option>
                    <option value="endTime">End Time</option>
                    <option value="points">Points</option>
                </select>

                <select name="order" value={filters.order} onChange={handleFilterChange}>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                </select>

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

            </div>

            {events.length === 0 ? (
                <div className="no-events">No upcoming events found.</div>
            ) : (
                <>
                    {user && user.role === 'regular' && (
                        <div className="my-events-section">
                            <h2>My Events</h2>
                            {organizedEventsList.length > 0 ? (
                                <div className="events-grid">
                                    {organizedEventsList.map(event => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            onRsvp={handleRsvp}
                                            onCancelRsvp={handleCancelRsvp}
                                            isRsvped={userRsvps.has(event.id)}
                                            canEdit={true}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="no-events-placeholder">
                                    You have no organized events at this time.
                                </div>
                            )}
                            <hr className="section-divider" />
                            <h2>All Events</h2>
                        </div>
                    )}

                    <div className="events-grid">
                        {filteredEvents.map(event => {
                            const canEdit = (user && (user.role === 'manager' || user.role === 'superuser')) || event.isOrganizer;

                            return (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    onRsvp={handleRsvp}
                                    onCancelRsvp={handleCancelRsvp}
                                    isRsvped={userRsvps.has(event.id)}
                                    canEdit={canEdit}
                                    onDelete={handleDelete}
                                />
                            );
                        })}
                    </div>

                    <div className="pagination">
                        <button onClick={handlePrevPage} disabled={page === 1}>
                            Previous
                        </button>
                        <span>Page {page} of {totalPages}</span>
                        <button onClick={handleNextPage} disabled={page === totalPages}>
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default EventsPage;