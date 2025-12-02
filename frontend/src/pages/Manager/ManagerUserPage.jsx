import React, { useState, useEffect } from 'react';
import UserList from './ManagerComponents/UserList';
import UserDetail from './ManagerComponents/UserDetail';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const ManagerUserPage = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editMode, setEditMode] = useState(false);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUserSelect = (user) => {
        setEditMode(false);
        setSelectedUser(user);
    };

    const handleUpdate = async () => {
        fetchUsers();
        try {
            const token = getToken();
            const response = await fetch(`${backendUrl}/users/${selectedUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const updatedUser = await response.json();
                setSelectedUser(updatedUser);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="manager-tables-page">
            <h1>User Management</h1>
            {loading && <p>Loading...</p>}

            {!loading && (
                <div className={`tables-content ${selectedUser ? 'split-view' : 'centered-view'}`}>

                    <div className="history-pane">
                        <UserList
                            users={users}
                            onUserSelect={handleUserSelect}
                        />
                    </div>

                    {selectedUser && (
                        <div className="details-pane">
                            <UserDetail
                                user={selectedUser}
                                editMode={editMode}
                                setEditMode={setEditMode}
                                onClose={() => setSelectedUser(null)}
                                onUpdate={handleUpdate}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ManagerUserPage;
