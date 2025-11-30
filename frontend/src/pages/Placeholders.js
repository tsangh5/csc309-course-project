import React from 'react';

const Placeholder = ({ title }) => (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>{title}</h2>
        <p>This page is under construction.</p>
    </div>
);

export const Login = () => <Placeholder title="Login Page" />;
export const UserDashboard = () => <Placeholder title="User Dashboard" />;
export const CashierDashboard = () => <Placeholder title="Cashier Dashboard" />;
export const ManagerDashboard = () => <Placeholder title="Manager Dashboard" />;
export const EventsPage = () => <Placeholder title="Events Page" />;
export const PromotionsPage = () => <Placeholder title="Promotions Page" />;
export const TransactionsPage = () => <Placeholder title="Transactions Page" />;
