import React from 'react';
import DataTable from '../../../components/Table/DataTable';

const UserList = ({ users, onUserSelect }) => {

    const columns = [
        {
            key: 'id',
            label: 'ID',
            render: (row) => `#${row.id}`
        },
        {
            key: 'utorid',
            label: 'UTORid',
        },
        {
            key: 'name',
            label: 'Name',
        },
        {
            key: 'email',
            label: 'Email',
        },
        {
            key: 'role',
            label: 'Role',
            render: (row) => (
                <span className={`th-badge th-badge-${row.role}`}>{row.role}</span>
            )
        },
        {
            key: 'points',
            label: 'Points',
            render: (row) => row.points || 0
        },
        {
            key: 'verified',
            label: 'Verified',
            render: (row) => (
                row.verified ? <span className="th-badge th-badge-verified">Yes</span> : <span className="th-badge th-badge-pending">No</span>
            )
        }
    ];

    const filters = [
        {
            key: 'role',
            label: 'All Roles',
            options: [
                { value: 'regular', label: 'Regular' },
                { value: 'cashier', label: 'Cashier' },
                { value: 'manager', label: 'Manager' },
            ]
        },
        {
            key: 'verified',
            label: 'Verification Status',
            options: [
                { value: 'true', label: 'Verified' },
                { value: 'false', label: 'Unverified' },
            ],
            customFilter: (row, value) => {
                if (value === 'true') return row.verified === true;
                if (value === 'false') return !row.verified;
                return true;
            }
        }
    ];

    const searchKeys = ['id', 'utorid', 'name', 'email'];

    return (
        <div className="user-list-container">
            <DataTable
                title="Users"
                data={users}
                columns={columns}
                filters={filters}
                searchKeys={searchKeys}
                pageSize={10}
                onRowClick={onUserSelect}
            />
        </div>
    );
};

export default UserList;
