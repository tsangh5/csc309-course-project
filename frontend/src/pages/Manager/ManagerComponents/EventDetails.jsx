import React, { useState, useEffect } from 'react';
import './EventDetails.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

const EventDetails = ({ event, onBack, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ ...event });
    const [guests, setGuests] = useState([]);

    const getToken = () => localStorage.getItem('token');

    useEffect(() => {
        fetchGuests();
    }, [event.id]);

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

            alert("Event deleted.");
            onBack();
            onUpdate();
        } catch (error) {
            console.error(error);
            alert("Failed to delete event.");
            setLoading(false);
        }
    };

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

    return (
        <div className="event-details-container">
            <button className="back-button" onClick={onBack}>&larr; Back to List</button>
            <h2>Event Details #{event.id}</h2>

            {editMode ? (
                <div className="edit-form">
                    <div className="form-group">
                        <label>Name:</label>
                        <input name="name" value={formData.name} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Location:</label>
                        <input name="location" value={formData.location} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Start Time:</label>
                        <input name="startTime" type="datetime-local" value={formData.startTime ? new Date(formData.startTime).toISOString().slice(0, 16) : ''} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Capacity:</label>
                        <input name="capacity" type="number" value={formData.capacity} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Points:</label>
                        <input name="points" type="number" value={formData.points} onChange={handleInputChange} />
                    </div>
                    <button className="btn-save" onClick={handleSave} disabled={loading}>Save</button>
                    <button className="btn-cancel" onClick={() => setEditMode(false)} disabled={loading}>Cancel</button>
                </div>
            ) : (
                <div className="view-details">
                    <p><strong>Name:</strong> {event.name}</p>
                    <p><strong>Location:</strong> {event.location}</p>
                    <p><strong>Start Time:</strong> {new Date(event.startTime).toLocaleString()}</p>
                    <p><strong>Capacity:</strong> {event.capacity || 'Unlimited'}</p>
                    <p><strong>Points:</strong> {event.points}</p>
                    <div className="action-buttons">
                        <button className="btn-edit" onClick={() => setEditMode(true)}>Edit</button>
                        <button className="btn-delete" onClick={handleDelete}>Delete Event</button>
                    </div>
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
    );
};

export default EventDetails;
