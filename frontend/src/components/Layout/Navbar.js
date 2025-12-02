import React, { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { authHelper } from '../../utils/authHelper';
import { FaUserCircle } from 'react-icons/fa';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [user, setUser] = useState(authHelper());
    const dropdownRef = useRef(null);
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
        setIsDropdownOpen(false);
        navigate('/');
    };

    const role = user?.role?.toLowerCase();
    const isLoggedIn = !!user;

    const menuClass = isLoggedIn
        ? (isOpen ? 'nav-menu active' : 'nav-menu')
        : 'nav-menu not-logged-in';

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-logo" onClick={() => setIsOpen(false)}>
                Nebula
            </Link>
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
                    </>
                ) : (
                    <li className="nav-item">
                        <NavLink to="/login" className="nav-links" onClick={toggleMenu}>
                            Login
                        </NavLink>
                    </li>
                )}
            </ul >
            {isLoggedIn && (
                <div className="navbar-actions">
                    <div className="user-menu" ref={dropdownRef}>
                        {console.log("user:", user)}
                        <div className="user-toggle" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            <FaUserCircle className="user-icon" />
                            <span className="user-name">{user.utorid}</span>
                        </div>
                        {isDropdownOpen && (
                            <div className="user-dropdown">
                                <div className="user-info">
                                    <p className="user-name-display">{user.role}</p>
                                </div>
                                <button className="logout-btn" onClick={handleLogout}>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="menu-icon" onClick={toggleMenu}>
                        <span className="hamburger"></span>
                    </div>
                </div>
            )}
        </nav >
    );
};

export default Navbar;