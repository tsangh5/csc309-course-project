import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { authHelper } from '../../utils/authHelper';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(authHelper());
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setUser(authHelper());
    }, [location]);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        setUser(authHelper());
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsOpen(false);
        navigate('/login');
    };

    const role = user?.role?.toLowerCase();
    const isLoggedIn = !!user;

    const menuClass = isLoggedIn
        ? (isOpen ? 'nav-menu active' : 'nav-menu')
        : 'nav-menu not-logged-in';

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-logo" onClick={() => setIsOpen(false)}>
                LoyaltyApp
            </Link>
            {isLoggedIn && (
                <div className="menu-icon" onClick={toggleMenu}>
                    <span className="hamburger"></span>
                </div>
            )}

            <ul className={menuClass}>
                {isLoggedIn ? (
                    <>
                        {role === 'regular' ? (
                            <li className="nav-item">
                                <NavLink to="/dashboard/user" className="nav-links" onClick={toggleMenu}>
                                    Dashboard
                                </NavLink>
                            </li>
                        ) : (
                            <li className="nav-item">
                                <NavLink to="/dashboard/" className="nav-links" onClick={toggleMenu}>
                                    Dashboard
                                </NavLink>
                            </li>
                        )}
                        <li className="nav-item">
                            <NavLink to="/events" className="nav-links" onClick={toggleMenu}>
                                Events
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/promotions" className="nav-links" onClick={toggleMenu}>
                                Promotions
                            </NavLink>
                        </li>
                        <li className="nav-item" onClick={handleLogout}>
                            <span className="nav-links">
                                Logout
                            </span>
                        </li>
                    </>
                ) : (
                    <li className="nav-item">
                        <NavLink to="/login" className="nav-links" onClick={toggleMenu}>
                            Login
                        </NavLink>
                    </li>
                )}
            </ul >
        </nav >
    );
};

export default Navbar;