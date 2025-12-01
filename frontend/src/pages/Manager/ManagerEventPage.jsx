import React, { useState, useEffect } from 'react';
import EventHistory from './ManagerComponents/EventHistory';
import EventDetails from './ManagerComponents/EventDetails';
import './ManagerEventPage.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

const ManagerEventPage = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newEventData, setNewEventData] = useState({
        name: '',
        location: '',
        startTime: '',
        capacity: '',
        points: 0
    });

    const getToken = () => localStorage.getItem('token');

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${backendUrl}/events`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch events');

            const data = await response.json();
            const results = Array.isArray(data) ? data : (data.results || []);
            setEvents(results);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleEventSelect = (event) => {
        setSelectedEvent(event);
    };

    const handleBack = () => {
        setSelectedEvent(null);
    };

    const handleUpdate = () => {
        fetchEvents();
        if (selectedEvent) {
            const token = getToken();
            fetch(`${backendUrl}/events/${selectedEvent.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(data => setSelectedEvent(data))
                .catch(err => console.error(err));
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            const token = getToken();
            const response = await fetch(`${backendUrl}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newEventData)
            });

            if (!response.ok) throw new Error('Failed to create event');

            alert("Event created successfully!");
            setShowCreateModal(false);
            setNewEventData({ name: '', location: '', startTime: '', capacity: '', points: 0 });
            fetchEvents();
        } catch (error) {
            console.error(error);
            alert("Failed to create event.");
        }
    };

    return (
        <div className="manager-event-page">
            <h1>Event Management</h1>
            {loading && <p>Loading...</p>}

            {!loading && (
                <>
                    <EventHistory
                        events={events}
                        onEventSelect={handleEventSelect}
                        onCreateEvent={() => setShowCreateModal(true)}
                    />

                    {showCreateModal && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2>Create New Event</h2>
                                <form onSubmit={handleCreateEvent}>
                                    <div className="form-group">
                                        <label>Name:</label>
                                        <input
                                            value={newEventData.name}
                                            onChange={e => setNewEventData({ ...newEventData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Location:</label>
                                        <input
                                            value={newEventData.location}
                                            onChange={e => setNewEventData({ ...newEventData, location: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Start Time:</label>
                                        <input
                                            type="datetime-local"
                                            value={newEventData.startTime}
                                            onChange={e => setNewEventData({ ...newEventData, startTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Capacity:</label>
                                        <input
                                            type="number"
                                            value={newEventData.capacity}
                                            onChange={e => setNewEventData({ ...newEventData, capacity: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Points:</label>
                                        <input
                                            type="number"
                                            value={newEventData.points}
                                            onChange={e => setNewEventData({ ...newEventData, points: e.target.value })}
                                        />
                                    </div>
                                    <div className="modal-actions">
                                        <button type="submit" className="btn-primary">Create</button>
                                        <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}

            {!loading && selectedEvent && (
                <EventDetails
                    event={selectedEvent}
                    onBack={handleBack}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
};

export default ManagerEventPage;
