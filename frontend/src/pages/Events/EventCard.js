import React from 'react';
import { Link } from 'react-router-dom';
import './Events.css';
import { FaPencilAlt, FaRegTrashAlt } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { MdOutlineEditCalendar } from "react-icons/md";


const EventCard = ({ event, onRsvp, onCancelRsvp, isRsvped, canEdit, onDelete }) => {
    const formatDate = (dateString) => {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="event-card">
            <div className="event-card-header">
                <span className="event-points">{event.points} PTS</span>
                {event.isOrganizer && (
                    <span className="event-organizer-icon">
                        <MdOutlineEditCalendar />
                        <span className="hover-text">You are an organizer!</span>
                    </span>
                )}
                {event.capacity && (
                    <span className={`event-capacity ${event.numGuests >= event.capacity ? 'full' : ''}`}>
                        {event.numGuests} / {event.capacity}
                    </span>
                )}
            </div>
            <div className="event-card-body">
                <Link to={`/events/${event.id}`} className="event-title-link">
                    <h3 className="event-title">{event.name}</h3>
                </Link>
                <p className="event-location">
                    {event.location}
                </p>
                <p className="event-time">
                    {formatDate(event.startTime)} - {formatDate(event.endTime)}
                </p>
                <p className="event-description">{event.description}</p>
            </div>
            <div className="event-card-footer">
                <div className="event-actions">
                    {isRsvped ? (
                        <button className="btn-rsvp cancel" onClick={() => onCancelRsvp(event.id)}>
                            Cancel RSVP
                        </button>
                    ) : (
                        <button
                            className="btn-rsvp"
                            onClick={() => onRsvp(event.id)}
                            disabled={event.capacity && event.numGuests >= event.capacity}
                        >
                            {event.capacity && event.numGuests >= event.capacity ? 'Full' : 'RSVP'}
                        </button>
                    )}

                    {canEdit && (
                        <div className="admin-actions">
                            <Link to={`/events/${event.id}/people`} className="btn-icon" title="Manage People">
                                <FaPeopleGroup />
                            </Link>
                            <Link to={`/events/${event.id}/edit`} className="btn-icon edit">
                                <FaPencilAlt />
                            </Link>
                            <button className="btn-icon delete" onClick={() => onDelete(event.id)}>
                                <FaRegTrashAlt />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventCard;
