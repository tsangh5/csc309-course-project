import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EventCard from './EventCard';
import './Events.css';

const EventsPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [userRsvps, setUserRsvps] = useState(new Set());
    const [user, setUser] = useState(null);
    const [organizedEventsList, setOrganizedEventsList] = useState([]);
    const [token, setToken] = useState(localStorage.getItem('token'));

    const LIMIT = 9;
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

    const fetchEvents = async () => {
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

            // Populate userRsvps from the response
            const rsvps = new Set();
            data.results.forEach(event => {
                if (event.isRsvped) {
                    rsvps.add(event.id);
                }
            });
            setUserRsvps(rsvps);

        } catch (err) {
            setError('Failed to load events. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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

    useEffect(() => {
        fetchEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

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

            setUserRsvps(prev => new Set(prev).add(eventId));
            fetchEvents();
            alert('RSVP successful!');
        } catch (err) {
            alert(err.message || 'Failed to RSVP');
        }
    };

    const fetchUser = async () => {
        try {
            const baseUrl = process.env.REACT_APP_BACKEND_URL;
            const response = await fetch(`${baseUrl}/users/me`, {
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
    };

    useEffect(() => {
        if (token) {
            fetchUser();
        }
    }, [token]);

    useEffect(() => {
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
    }, [user]);

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

            setUserRsvps(prev => {
                const next = new Set(prev);
                next.delete(eventId);
                return next;
            });
            fetchEvents();
            alert('RSVP cancelled.');
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
            alert('Event deleted successfully');
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

    const canCreate = user && (user.role === 'manager' || user.role === 'superuser');

    if (loading && events.length === 0) return <div className="loading">Loading events...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="events-container">
            <div className="events-header">
                <h1>Upcoming Events</h1>
                <p>Discover and join exclusive events happening near you.</p>

                {canCreate && (
                    <div className="header-actions">
                        <Link to="/events/new" className="btn-create">
                            <i className="fas fa-plus"></i> Create Event
                        </Link>
                    </div>
                )}
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
                        {events.map(event => {
                            // Check permissions for this specific event
                            // Managers can edit any event. Organizers can edit their own.
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
