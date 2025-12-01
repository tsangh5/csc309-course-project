import React from 'react';
import DataTable from '../../../components/Table/DataTable';

const PromotionHistory = ({ promotions, onPromotionSelect, onCreatePromotion }) => {

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
            key: 'type',
            label: 'Type',
            render: (row) => <span className="datatable-badge datatable-badge-info">{row.type}</span>
        },
        {
            key: 'startTime',
            label: 'Start Time',
            getValue: (row) => row.startTime ? new Date(row.startTime).getTime() : 0,
            render: (row) => row.startTime ? new Date(row.startTime).toLocaleString() : 'N/A'
        },
        {
            key: 'endTime',
            label: 'End Time',
            getValue: (row) => row.endTime ? new Date(row.endTime).getTime() : 0,
            render: (row) => row.endTime ? new Date(row.endTime).toLocaleString() : 'N/A'
        },
        {
            key: 'rate',
            label: 'Rate',
            render: (row) => row.rate || 'N/A'
        },
        {
            key: 'points',
            label: 'Points',
            render: (row) => row.points || 'N/A'
        }
    ];

    const searchKeys = ['id', 'name', 'type', 'description'];

    return (
        <div className="promotion-history-container">
            <div className="actions-bar" style={{ marginBottom: '1rem', textAlign: 'right' }}>
                <button className="btn-primary" onClick={onCreatePromotion}>+ Create New Promotion</button>
            </div>
            <DataTable
                title="Promotions"
                data={promotions}
                columns={columns}
                searchKeys={searchKeys}
                pageSize={10}
                onRowClick={onPromotionSelect}
            />
        </div>
    );
};

export default PromotionHistory;
