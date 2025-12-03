import React, { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';

const Home = lazy(() => import('./pages/Home/Home'));
const User = lazy(() => import('./pages/User/User'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login/Login'));
const ResetRequest = lazy(() => import('./pages/Login/ResetRequest'));
const ResetPassword = lazy(() => import('./pages/Login/ResetPassword'));
const EventsPage = lazy(() => import('./pages/Events/Events'));
const EventForm = lazy(() => import('./pages/Events/EventForm'));
const EventDetails = lazy(() => import('./pages/Events/EventDetails'));
const EventPeople = lazy(() => import('./pages/Events/EventPeople'));
const PromotionsList = lazy(() => import('./pages/Promotions/PromotionsList'));
const CreatePromotion = lazy(() => import('./pages/Promotions/CreatePromotion'));
const EditPromotion = lazy(() => import('./pages/Promotions/EditPromotion'));
const CashierDashboard = lazy(() => import('./pages/Cashier/CashierDashboard'));
const CreateTransaction = lazy(() => import('./pages/Cashier/CreateTransaction'));
const ProcessRedemption = lazy(() => import('./pages/Cashier/ProcessRedemption'));
const RegisterUser = lazy(() => import('./pages/Cashier/RegisterUser'));
const ManagerDashboard = lazy(() => import('./pages/Manager/ManagerDashboard'));
const ManagerUserPage = lazy(() => import('./pages/Manager/ManagerUserPage'));
const ManagerTransactionPage = lazy(() => import('./pages/Manager/ManagerTransactionPage'));
const ManagerAnalytics = lazy(() => import('./pages/Manager/ManagerAnalytics'));
const Admin = lazy(() => import('./pages/Admin/Admin'));
const Profile = lazy(() => import('./pages/User/Profile'));

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            { path: '/', element: <Home /> },
            { path: '/login', element: <Login /> },
            { path: '/reset-request', element: <ResetRequest /> },
            { path: '/reset-password', element: <ResetPassword /> },
            { path: '/activate', element: <ResetPassword /> },
            { path: '/dashboard', element: <Dashboard /> },
            { path: '/dashboard/user', element: <User /> },
            { path: '/dashboard/cashier', element: <CashierDashboard /> },
            { path: '/cashier/create-transaction/:id?', element: <CreateTransaction /> },
            { path: '/cashier/process-redemption/:id?', element: <ProcessRedemption /> },
            { path: '/cashier/register-user', element: <RegisterUser /> },
            { path: '/dashboard/manager', element: <ManagerDashboard /> },
            { path: '/dashboard/manager/users', element: <ManagerUserPage /> },
            { path: '/dashboard/manager/transactions', element: <ManagerTransactionPage /> },
            { path: '/dashboard/manager/analytics', element: <ManagerAnalytics /> },
            { path: '/dashboard/admin/', element: <Admin /> },
            { path: '/events', element: <EventsPage /> },
            { path: '/events/new', element: <EventForm /> },
            { path: '/events/:id/people', element: <EventPeople /> },
            { path: '/events/:id', element: <EventDetails /> },
            { path: '/events/:id/edit', element: <EventForm /> },
            { path: '/promotions', element: <PromotionsList /> },
            { path: '/promotions/new', element: <CreatePromotion /> },
            { path: '/promotions/:id/edit', element: <EditPromotion /> },
            { path: '/profile', element: <Profile /> },
        ],
    },
]);

export default router;
