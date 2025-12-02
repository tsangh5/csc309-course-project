import React, { useState, useEffect } from 'react';
import './EventDetails.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

const EventDetails = ({ event, onClose, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ ...event });
    const [guests, setGuests] = useState([]);

    const getToken = () => localStorage.getItem('token');

    useEffect(() => {
        fetchGuests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event.id]);

    useEffect(() => {
        setFormData({ ...event });
    }, [event]);

    const fetchGuests = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${backendUrl}/events/${event.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.guests) {
                    setGuests(data.guests);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const response = await fetch(`${backendUrl}/events/${event.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to update event');

            alert("Event updated successfully!");
            setEditMode(false);
            onUpdate();
        } catch (error) {
            console.error(error);
            alert("Failed to update event.");
        } finally {
            setLoading(false);
        }
    };

    /*
    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            setLoading(true);
            const token = getToken();
            const response = await fetch(`${backendUrl}/events/${event.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete event');
            
            alert("Event deleted successfully!");
            onUpdate(); // This should probably trigger a refresh in parent
            onBack();
        } catch (error) {
            console.error(error);
            alert("Failed to delete event.");
        } finally {
            setLoading(false);
        }
    };
    */

    const handleRemoveGuest = async (userId) => {
        if (!window.confirm("Remove this guest?")) return;
        try {
            setLoading(true);
            const token = getToken();
            const response = await fetch(`${backendUrl}/events/${event.id}/guests/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to remove guest');

            alert("Guest removed.");
            fetchGuests();
        } catch (error) {
            console.error(error);
            alert("Failed to remove guest.");
        } finally {
            setLoading(false);
        }
    };

    console.log(event)

    return (
        <div className="details-container">
            <div className="details-header" style={{ backgroundColor: '#1e1e1e' }}>
                <div>
                    <h2 className="details-title">Event Details #{event.id}</h2>
                </div>
                <button className="details-close-btn" onClick={onClose} aria-label="Close details">&times;</button>
            </div>

            <div className="details-content">
                {editMode ? (
                    <div className="edit-form">
                        <div className="details-form-group">
                            <label>Name:</label>
                            <input name="name" value={formData.name} onChange={handleInputChange} />
                        </div>
                        <div className="details-form-group">
                            <label>Location:</label>
                            <input name="location" value={formData.location} onChange={handleInputChange} />
                        </div>
                        <div className="details-form-group">
                            <label>Start Time:</label>
                            <input name="startTime" value={formData.startTime} onChange={handleInputChange} />
                        </div>
                        <div className="details-form-group">
                            <label>End Time:</label>
                            <input name="endTime" value={formData.endTime} onChange={handleInputChange} />
                        </div>
                        <div className="details-form-group">
                            <label>Points:</label>
                            <input name="points" value={formData.points} onChange={handleInputChange} />
                        </div>
                        <div className="details-form-group">
                            <div className="details-checkbox-group" style={{ accentColor: '#1e1e1e' }}>
                                <label> Published</label>
                                <input
                                    type="checkbox"
                                    name="verified"
                                    checked={formData.verified}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <button className="details-btn-save" onClick={handleSave} disabled={loading}>Save</button>
                        <button className="details-btn-cancel" onClick={() => setEditMode(false)} disabled={loading}>Cancel</button>
                    </div>
                ) : (
                    <div className="details-details">
                        <div className="details-row">
                            <span className="details-label">Name</span>
                            <span className="details-value">{event.name}</span>
                        </div>
                        <div className="details-row">
                            <span className="details-label">Location</span>
                            <span className="details-value">{event.location}</span>
                        </div>
                        <div className="details-row">
                            <span className="details-label">Start Time</span>
                            <span className="details-value">{new Date(event.startTime).toLocaleString()}</span>
                        </div>
                        <div className="details-row">
                            <span className="details-label">End Time</span>
                            <span className="details-value">{new Date(event.endTime).toLocaleString()}</span>
                        </div>
                        <div className="details-row">
                            <span className="details-label">Guest Count</span>
                            <span className="details-value">{event.numGuests}</span>
                        </div>
                        <div className="details-row">
                            <span className="details-label">Points Awarded</span>
                            <span className="details-value">{event.pointsAwarded}</span>
                        </div>
                        <div className="details-row">
                            <span className="details-label">Points Remaining</span>
                            <span className="details-value">{event.pointsRemain}</span>
                        </div>
                        <div className="details-row">
                            <span className="details-label">Total Points</span>
                            <span className="details-value">{event.pointsAwarded + event.pointsRemain}</span>
                        </div>

                        <div className="details-row">
                            <span className="details-label">Published</span>
                            <span className="details-value">{event.published ? 'Yes' : 'No'}</span>
                        </div>
                        <button className="details-btn-primary" onClick={() => setEditMode(true)}>Edit Event</button>
                    </div>
                )}

                <div className="guests-section">
                    <h3>Guests ({guests.length})</h3>
                    <ul>
                        {guests.map(guest => (
                            <li key={guest.id}>
                                {guest.name} ({guest.utorid})
                                <button className="btn-remove-guest" onClick={() => handleRemoveGuest(guest.id)}>Remove</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;
