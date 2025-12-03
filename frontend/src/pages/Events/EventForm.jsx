import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authHelper } from '../../utils/authHelper';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import './Events.css';

const libraries = ['places'];

const EventForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;
    const [loading, setLoading] = useState(isEditMode);
    const [error, setError] = useState(null);
    const [user] = useState(authHelper());

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: libraries
    });

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        latitude: null,
        longitude: null,
        startTime: '',
        endTime: '',
        capacity: '',
        points: ''
    });

    const autocompleteRef = useRef(null);

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
        if (isEditMode) {
            fetchEvent();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchEvent = async () => {
        try {
            const response = await fetch(`${BASE_URL}/events/${id}`, {
                method: 'GET',
                headers: getHeaders(),
            });
            if (!response.ok) throw new Error('Failed to fetch event');
            const data = await response.json();

            // Format dates for input fields (datetime-local expects YYYY-MM-DDThh:mm)
            const formatForInput = (dateStr) => {
                if (!dateStr) return '';
                return new Date(dateStr).toISOString().slice(0, 16);
            };

            setFormData({
                name: data.name,
                description: data.description,
                location: data.location,
                latitude: data.latitude,
                longitude: data.longitude,
                startTime: formatForInput(data.startTime),
                endTime: formatForInput(data.endTime),
                capacity: data.capacity || '',
                points: data.pointsRemain || '',
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();

            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();

                setFormData(prev => ({
                    ...prev,
                    location: place.formatted_address || place.name,
                    latitude: lat,
                    longitude: lng
                }));
            } else if (place.name) {
                setFormData(prev => ({
                    ...prev,
                    location: place.name,
                }));
            }
        }
    };

    const onLoadAutocomplete = (autocomplete) => {
        autocompleteRef.current = autocomplete;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const url = isEditMode ? `${BASE_URL}/events/${id}` : `${BASE_URL}/events`;
            const method = isEditMode ? 'PATCH' : 'POST';

            let finalLat = formData.latitude;
            let finalLng = formData.longitude;

            // If coords are missing but we have a location string, try to fetch them now
            if ((!finalLat || !finalLng) && formData.location && window.google) {
                try {
                    const request = {
                        textQuery: formData.location,
                        fields: ['location'],
                        maxResultCount: 1,
                    };
                    const { places } = await window.google.maps.places.Place.searchByText(request);
                    if (places.length > 0 && places[0].location) {
                        finalLat = places[0].location.lat();
                        finalLng = places[0].location.lng();
                    }
                } catch (fetchErr) {
                    // Continue without coords if fetch fails
                }
            }

            // Convert empty strings to null/numbers
            const payload = {
                ...formData,
                capacity: formData.capacity ? parseInt(formData.capacity) : null,
                points: formData.points ? parseInt(formData.points) : 0,
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
                latitude: finalLat,
                longitude: finalLng
            };

            const response = await fetch(url, {
                method,
                headers: getHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to save event');
            }

            navigate('/events');
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <main className="events-container">
            <header className="events-header">
                <h1>{isEditMode ? 'Edit Event' : 'Create New Event'}</h1>
                <Link to="/events" className="back-link">Cancel</Link>
            </header>

            <form onSubmit={handleSubmit} className="event-form">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                    <label>Event Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="input-field"
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="input-field textarea"
                        rows="4"
                    />
                </div>

                <div className="form-group">
                    <label>Location</label>
                    {isLoaded ? (
                        <Autocomplete
                            onLoad={onLoadAutocomplete}
                            onPlaceChanged={onPlaceChanged}
                        >
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="Search for a location"
                            />
                        </Autocomplete>
                    ) : (
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                            className="input-field"
                            placeholder="Loading location search..."
                        />
                    )}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Start Time</label>
                        <input
                            type="datetime-local"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            required
                            className="input-field"
                        />
                    </div>
                    <div className="form-group">
                        <label>End Time</label>
                        <input
                            type="datetime-local"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            required
                            className="input-field"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Capacity (Optional)</label>
                        <input
                            type="number"
                            name="capacity"
                            value={formData.capacity}
                            onChange={handleChange}
                            className="input-field"
                            min="1"
                        />
                    </div>
                    {/* Only managers can set points */}
                    {user && (user.role === 'manager' || user.role === 'superuser') && (
                        <div className="form-group">
                            <label>Points to Allocate</label>
                            <input
                                type="number"
                                name="points"
                                value={formData.points}
                                onChange={handleChange}
                                className="input-field"
                                min="0"
                            />
                        </div>
                    )}
                </div>



                <button type="submit" className="btn btn-primary">
                    {isEditMode ? 'Update Event' : 'Create Event'}
                </button>
            </form>
        </main>
    );
};

export default EventForm;
