import React, { useState, useEffect } from 'react';
import UserList from './ManagerComponents/UserList';
import UserDetail from './ManagerComponents/UserDetail';
import RegisterUserForm from '../../components/Forms/RegisterUserForm';
import './ManagerPages.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const ManagerUserPage = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);

    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [activationData, setActivationData] = useState(null);

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

    const handleRegisterSuccess = (data) => {
        setShowRegisterModal(false);
        fetchUsers();

        if (data.resetToken) {
            setActivationData({
                token: data.resetToken,
                link: `${window.location.origin}/activate?token=${data.resetToken}&utorid=${data.utorid}`,
                utorid: data.utorid
            });
        }
    };

    return (
        <div className="manager-tables-page">
            <div className="page-header">
                <h1>User Management</h1>
            </div>

            {activationData && (
                <div className="alert-box success" style={{ marginBottom: '20px', padding: '15px', border: '1px solid green', borderRadius: '5px', backgroundColor: '#e6fffa' }}>
                    <h3>User Created: {activationData.utorid}</h3>
                    <p><strong>Action Required:</strong> Since emails are disabled, copy this link to set the password:</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <input
                            type="text"
                            readOnly
                            value={activationData.link}
                            style={{ flex: 1, padding: '5px' }}
                        />
                        <button onClick={() => {
                            navigator.clipboard.writeText(activationData.link);
                            alert('Copied to clipboard!');
                        }}>
                            Copy
                        </button>
                        <button onClick={() => setActivationData(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {loading && <p>Loading...</p>}

            {!loading && (
                <div className={`tables-content ${selectedUser ? 'split-view' : 'centered-view'}`}>

                    <div className="history-pane">
                        <UserList
                            users={users}
                            onUserSelect={handleUserSelect}
                            actions={
                                <button className="btn-simplistic" onClick={() => setShowRegisterModal(true)}>
                                    + Register User
                                </button>
                            }
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

            {showRegisterModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <RegisterUserForm
                            onSuccess={handleRegisterSuccess}
                            onCancel={() => setShowRegisterModal(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerUserPage;