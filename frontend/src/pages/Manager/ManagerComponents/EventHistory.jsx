import React from 'react';
import DataTable from '../../../components/Table/DataTable';

const EventHistory = ({ events, onEventSelect }) => {

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
            key: 'startTime',
            label: 'Start Time',
            getValue: (row) => new Date(row.startTime).getTime(),
            render: (row) => new Date(row.startTime).toLocaleString()
        },
        {
            key: 'numGuests',
            label: 'Guest Count',
            render: (row) => row.numGuests || 0
        },
        {
            key: 'published',
            label: 'Published',
            render: (row) => (
                row.published ? <span className="datatable-badge datatable-badge-green">Yes</span> : <span className="datatable-badge datatable-badge-red">No</span>
            )
        }
    ];

    const filters = [
        {
            key: 'published',
            label: 'All Published Statuses',
            options: [
                { value: 'true', label: 'Published' },
                { value: 'false', label: 'Not Published' },
            ],
            customFilter: (row, value) => {
                if (value === 'true') return row.published === true;
                if (value === 'false') return !row.published;
                return true;
            }
        }
    ]

    const searchKeys = ['id', 'name'];

    return (
        <DataTable
            title="Events"
            data={events}
            columns={columns}
            searchKeys={searchKeys}
            pageSize={10}
            onRowClick={onEventSelect}
            filters={filters}
        />
    );
};

export default EventHistory;
