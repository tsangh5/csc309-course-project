import React from 'react';
import DataTable from '../../../components/Table/DataTable';

const EventHistory = ({ events, onEventSelect, onCreateEvent }) => {

    const columns = [
        {
            key: 'id',
            label: 'ID',
            render: (row) => `#${row.id}`
        },
        {
            key: 'name',
            label: 'Name',
        },
        {
            key: 'location',
            label: 'Location',
        },
        {
            key: 'startTime',
            label: 'Start Time',
            getValue: (row) => new Date(row.startTime).getTime(),
            render: (row) => new Date(row.startTime).toLocaleString()
        },
        {
            key: 'capacity',
            label: 'Capacity',
            render: (row) => row.capacity || 'Unlimited'
        },
        {
            key: 'points',
            label: 'Points',
            render: (row) => row.points || 0
        }
    ];

    const searchKeys = ['id', 'name', 'location', 'description'];

    return (
        <div className="event-history-container">
            <div className="actions-bar" style={{ marginBottom: '1rem', textAlign: 'right' }}>
                <button className="btn-primary" onClick={onCreateEvent}>+ Create New Event</button>
            </div>
            <DataTable
                title="Events"
                data={events}
                columns={columns}
                searchKeys={searchKeys}
                pageSize={10}
                onRowClick={onEventSelect}
            />
        </div>
    );
};

export default EventHistory;
