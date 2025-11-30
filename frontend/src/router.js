import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Home from './pages/Home/Home';
import User from './pages/User/User';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login/Login';
import ResetRequest from './pages/Login/ResetRequest';
import ResetPassword from './pages/Login/ResetPassword';
import EventsPage from './pages/Events/Events';
import EventForm from './pages/Events/EventForm';
import EventDetails from './pages/Events/EventDetails';
import EventPeople from './pages/Events/EventPeople';
import PromotionsList from './pages/Promotions/PromotionsList';
import CreatePromotion from './pages/Promotions/CreatePromotion';
import EditPromotion from './pages/Promotions/EditPromotion';
import {
    ManagerDashboard,
    TransactionsPage,
} from './pages/Placeholders';
import CashierDashboard from './pages/Cashier/CashierDashboard';
import CreateTransaction from './pages/Cashier/CreateTransaction';
import ProcessRedemption from './pages/Cashier/ProcessRedemption';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            { path: '/', element: <Home /> },
            { path: '/login', element: <Login /> },
            { path: '/reset-request', element: <ResetRequest /> },
            { path: '/reset-password', element: <ResetPassword /> },
            { path: '/dashboard', element: <Dashboard /> },
            { path: '/dashboard/user', element: <User /> },
            { path: '/dashboard/cashier', element: <CashierDashboard /> },
            { path: '/cashier/create-transaction', element: <CreateTransaction /> },
            { path: '/cashier/process-redemption/:id?', element: <ProcessRedemption /> },
            { path: '/dashboard/manager', element: <ManagerDashboard /> },
            { path: '/events', element: <EventsPage /> },
            { path: '/events/new', element: <EventForm /> },
            { path: '/events/:id/people', element: <EventPeople /> },
            { path: '/events/:id', element: <EventDetails /> },
            { path: '/events/:id/edit', element: <EventForm /> },
            { path: '/promotions', element: <PromotionsList /> },
            { path: '/promotions/new', element: <CreatePromotion /> },
            { path: '/promotions/:id/edit', element: <EditPromotion /> },
            { path: '/transactions', element: <TransactionsPage /> },
        ],
    },
]);

export default router;
