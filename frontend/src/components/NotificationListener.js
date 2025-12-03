import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const NotificationListener = () => {
    const [notification, setNotification] = useState(null);
    const location = useLocation();
    const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
    // Convert http/https to ws/wss
    const WS_URL = BASE_URL.replace(/^http/, 'ws');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const ws = new WebSocket(`${WS_URL}?token=${token}`);

        ws.onopen = () => {
            console.log('Connected to notification service');
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'NEW_TRANSACTION') {
                    setNotification(`New transaction: ${message.data.utorid} spent $${message.data.spent}`);
                    setTimeout(() => setNotification(null), 5000);
                }
            } catch (e) {
                console.error('Failed to parse notification', e);
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from notification service');
        };

        return () => {
            ws.close();
        };
    }, [WS_URL, location.pathname]);

    if (!notification) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '16px',
            borderRadius: '4px',
            zIndex: 1000,
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
            {notification}
        </div>
    );
};

export default NotificationListener;
