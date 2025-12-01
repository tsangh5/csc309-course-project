import React from 'react';
import DataTable from '../../../components/Table/DataTable';
import './UserList.css';

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
                <span className={`datatable-badge datatable-badge-${row.role}`}>{row.role}</span>
            )
        },
        {
            key: 'verified',
            label: 'Verified',
            render: (row) => (
                row.verified ? <span className="datatable-badge datatable-badge-green">Yes</span> : <span className="datatable-badge datatable-badge-red">No</span>
            )
        },
        {
            key: 'suspicious',
            label: 'Suspicious',
            render: (row) => (
                row.suspicious ? <span className="datatable-badge datatable-badge-red">Yes</span> : <span className="datatable-badge datatable-badge-green">No</span>
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
                { value: 'superuser', label: 'Superuser' }
            ]
        },
        {
            key: 'verified',
            label: 'Verification Statuses',
            options: [
                { value: 'true', label: 'Verified' },
                { value: 'false', label: 'Unverified' },
            ],
            customFilter: (row, value) => {
                if (value === 'true') return row.verified === true;
                if (value === 'false') return !row.verified;
                return true;
            }
        },
        {
            key: 'suspicious',
            label: 'ALl Suspicious Statuses',
            options: [
                { value: 'true', label: 'Suspicious' },
                { value: 'false', label: 'Not Suspicious' },
            ],
            customFilter: (row, value) => {
                if (value === 'true') return row.suspicious === true;
                if (value === 'false') return !row.suspicious;
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
