import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Autocomplete } from '@react-google-maps/api';
import { Link } from 'react-router-dom';

const containerStyle = {
    width: '100%',
    height: '600px',
    borderRadius: '16px'
};

const defaultCenter = {
    lat: 43.6532, // Toronto
    lng: -79.3832
};

const libraries = ['places'];

const MapView = ({ events, onRsvp, userRsvps }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: libraries
    });

    const [map, setMap] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [searchResult, setSearchResult] = useState(null);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    const onPlaceChanged = () => {
        if (searchResult != null) {
            const place = searchResult.getPlace();
            if (place.geometry && place.geometry.location) {
                map.panTo(place.geometry.location);
                map.setZoom(14);
            }
        }
    };

    const onLoadAutocomplete = (autocomplete) => {
        setSearchResult(autocomplete);
    };

    // Filter events that have valid coordinates
    const mapEvents = useMemo(() => {
        const filtered = events.filter(event =>
            event.latitude && event.longitude &&
            !isNaN(parseFloat(event.latitude)) &&
            !isNaN(parseFloat(event.longitude))
        );
        return filtered;
    }, [events]);

    if (!isLoaded) {
        return <div className="loading">Loading Map...</div>;
    }

    return (
        <div className="map-container">
            <div className="map-search-bar">
                <Autocomplete
                    onLoad={onLoadAutocomplete}
                    onPlaceChanged={onPlaceChanged}
                >
                    <input
                        type="text"
                        placeholder="Search places..."
                        className="map-search-input"
                    />
                </Autocomplete>
            </div>

            <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                }}
            >
                {mapEvents.map(event => (
                    <Marker
                        key={event.id}
                        position={{
                            lat: parseFloat(event.latitude),
                            lng: parseFloat(event.longitude)
                        }}
                        onClick={() => setSelectedEvent(event)}
                        title={event.name}
                    />
                ))}

                {selectedEvent && (
                    <InfoWindow
                        position={{
                            lat: parseFloat(selectedEvent.latitude),
                            lng: parseFloat(selectedEvent.longitude)
                        }}
                        onCloseClick={() => setSelectedEvent(null)}
                    >
                        <div className="map-info-window">
                            <h3>{selectedEvent.name}</h3>
                            <p>{new Date(selectedEvent.startTime).toLocaleString()}</p>
                            <p>{selectedEvent.location}</p>

                            <div className="rsvp-status-container">
                                {userRsvps.has(selectedEvent.id) ? (
                                    <span className="rsvp-status">RSVP'd</span>
                                ) : (
                                    <button
                                        className="btn-rsvp-small"
                                        onClick={() => onRsvp(selectedEvent.id)}
                                    >
                                        RSVP
                                    </button>
                                )}
                            </div>

                            <Link to={`/events/${selectedEvent.id}`} className="view-details-link">
                                View Details
                            </Link>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    );
};

export default MapView;
