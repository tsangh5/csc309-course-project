import React from 'react';
import DataTable from '../../../components/Table/DataTable';

const AllTransactionHistory = ({ transactions, onTransactionSelect }) => {

    const columns = [
        {
            key: 'id',
            label: 'ID',
            render: (row) => `#${row.id}`
        },
        {
            key: 'utorid',
            label: 'User',
            render: (row) => row.utorid || 'Unknown'
        },
        {
            key: 'type',
            label: 'Type',
            render: (row) => (
                <span className={`th-badge th-badge-${row.type}`}>{row.type}</span>
            )
        },
        {
            key: 'createdAt',
            label: 'Date',
            getValue: (row) => new Date(row.createdAt).getTime(),
            render: (row) => new Date(row.createdAt).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
        },
        {
            key: 'amount',
            label: 'Points',
            render: (row) => {
                const awarded = row.awarded || 0;
                const redeemed = row.redeemed || 0;
                let points = 0;
                if (awarded > 0) points = awarded;
                if (redeemed > 0) points = -redeemed;

                return (
                    <span className={`th-points ${points >= 0 ? 'positive' : 'negative'}`}>
                        {points > 0 ? '+' : ''}{points}
                    </span>
                );
            }
        },
        {
            key: 'suspicious',
            label: 'Status',
            render: (row) => (
                row.suspicious ? <span className="th-badge th-badge-suspicious">Suspicious</span> : <span className="th-badge th-badge-verified">OK</span>
            )
        }
    ];

    const filters = [
        {
            key: 'type',
            label: 'All Types',
            options: [
                { value: 'purchase', label: 'Purchase' },
                { value: 'redemption', label: 'Redemption' },
                { value: 'transfer', label: 'Transfer' },
                { value: 'adjustment', label: 'Adjustment' },
                { value: 'event', label: 'Event' },
            ]
        },
        {
            key: 'suspicious',
            label: 'All Status',
            options: [
                { value: 'true', label: 'Suspicious' },
                { value: 'false', label: 'OK' },
            ],
            customFilter: (row, value) => {
                if (value === 'true') return row.suspicious === true;
                if (value === 'false') return !row.suspicious;
                return true;
            }
        }
    ];

    const searchKeys = ['id', 'type', 'remark', 'user.utorid'];

    return (
        <DataTable
            title="All Transactions"
            data={transactions}
            columns={columns}
            filters={filters}
            searchKeys={searchKeys}
            pageSize={10}
            onRowClick={onTransactionSelect}
        />
    );
};

export default AllTransactionHistory;
