import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authHelper } from '../../utils/authHelper';
import './Events.css';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaCoins } from "react-icons/fa";

const EventDetails = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user] = useState(authHelper());

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

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await fetch(`${BASE_URL}/events/${id}`, {
                    method: 'GET',
                    headers: getHeaders(),
                });
                if (!response.ok) throw new Error('Failed to fetch event');
                const data = await response.json();
                setEvent(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!event) return <div className="error">Event not found</div>;

    const isManager = user && (user.role === 'manager' || user.role === 'superuser');
    const isOrganizer = user && event.organizers.some(o => o.id === user.id);
    const canEdit = isManager || isOrganizer;

    const formatDate = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="events-container">
            <div className="event-details-card">
                <div className="event-details-header">
                    <h1>{event.name}</h1>
                    <div className="event-meta-badges">
                        {event.published ? (
                            <span className="badge published">Published</span>
                        ) : (
                            <span className="badge draft">Draft</span>
                        )}
                        <span className="badge points">{event.pointsAwarded || 0} PTS Awarded</span>
                    </div>
                </div>

                <div className="event-details-body">
                    <div className="detail-row">
                        <FaCalendarAlt className="detail-icon" />
                        <div>
                            <strong>Time</strong>
                            <p>{formatDate(event.startTime)} - {formatDate(event.endTime)}</p>
                        </div>
                    </div>

                    <div className="detail-row">
                        <FaMapMarkerAlt className="detail-icon" />
                        <div>
                            <strong>Location</strong>
                            <p>{event.location}</p>
                        </div>
                    </div>

                    <div className="detail-row">
                        <FaUsers className="detail-icon" />
                        <div>
                            <strong>Capacity</strong>
                            <p>{event.numGuests || 0} / {event.capacity || 'Unlimited'}</p>
                        </div>
                    </div>

                    {canEdit && (
                        <div className="detail-row">
                            <FaCoins className="detail-icon" />
                            <div>
                                <strong>Points Remaining</strong>
                                <p>{event.pointsRemain || 0}</p>
                            </div>
                        </div>
                    )}

                    <div className="description-section">
                        <h3>About this Event</h3>
                        <p>{event.description}</p>
                    </div>

                    <div className="organizers-section">
                        <h3>Organizers</h3>
                        <div className="organizer-list">
                            {event.organizers.map(org => (
                                <span key={org.id} className="organizer-tag">{org.name}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="event-details-footer">
                    <Link to="/events" className="back-link">← Back to Events</Link>
                    {canEdit && (
                        <div className="action-buttons">
                            <Link to={`/events/${event.id}/people`} className="btn-secondary">
                                Manage People
                            </Link>
                            <Link to={`/events/${event.id}/edit`} className="btn-primary">
                                Edit Event
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventDetails;
