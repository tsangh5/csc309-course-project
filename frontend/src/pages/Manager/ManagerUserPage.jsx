import React, { useState, useEffect } from 'react';
import UserList from './ManagerComponents/UserList';
import UserDetail from './ManagerComponents/UserDetail';
import './ManagerUserPage.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

const ManagerUserPage = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const getToken = () => localStorage.getItem('token');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${backendUrl}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch users');

            const data = await response.json();
            const results = Array.isArray(data) ? data : (data.results || []);
            setUsers(results);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUserSelect = (user) => {
        setSelectedUser(user);
    };

    const handleBack = () => {
        setSelectedUser(null);
    };

    const handleUpdate = () => {
        fetchUsers();
        if (selectedUser) {
            const token = getToken();
            fetch(`${backendUrl}/users/${selectedUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(data => setSelectedUser(data))
                .catch(err => console.error(err));
        }
    };

    return (
        <div className="manager-user-page">
            <h1>User Management</h1>
            {loading && <p>Loading...</p>}

            {!loading && !selectedUser && (
                <UserList
                    users={users}
                    onUserSelect={handleUserSelect}
                />
            )}

            {!loading && selectedUser && (
                <UserDetail
                    user={selectedUser}
                    onBack={handleBack}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
};

export default ManagerUserPage;
