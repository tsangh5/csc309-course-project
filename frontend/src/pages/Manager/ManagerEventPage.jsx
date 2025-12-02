import React, { useState, useEffect } from 'react';
import EventHistory from './ManagerComponents/EventHistory';
import EventDetails from './ManagerComponents/EventDetails';
import './ManagerEventPage.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

const ManagerEventPage = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEventSelect = (event) => {
        setSelectedEvent(event);
    };

    const handleUpdate = async () => {
        fetchEvents();
        try {
            const token = getToken();
            const res = await fetch(`${backendUrl}/events/${selectedEvent.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (res.ok) {
                setSelectedEvent(res.json())
            }
        } catch (error) {
            console.error(error);
        }
    };

    /*
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
            setNewEventData({ name: '', location: '', startTime: '', capacity: '', points: 0 });
            fetchEvents();
        } catch (error) {
            console.error(error);
            alert("Failed to create event.");
        }
    };
    */
    return (
        <div className="manager-tables-page">
            <h1>Transaction Management</h1>
            {loading && <p>Loading...</p>}

            {!loading && (
                <div className={`tables-content ${selectedEvent ? 'split-view' : 'centered-view'}`}>

                    <div className="history-pane">
                        <EventHistory
                            events={events}
                            onEventSelect={handleEventSelect}
                        />
                    </div>

                    {selectedEvent && (
                        <div className="details-pane">
                            <EventDetails
                                event={selectedEvent}
                                editMode={editMode}
                                setEditMode={setEditMode}
                                onClose={() => setSelectedEvent(null)}
                                onUpdate={handleUpdate}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ManagerEventPage;
