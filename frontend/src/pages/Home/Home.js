import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import { PiHandCoinsDuotone } from "react-icons/pi";
import { FaTrophy, FaGifts } from "react-icons/fa";
import { authHelper } from '../../utils/authHelper';


const Home = () => {
    const navigate = useNavigate();
    const user = authHelper();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <div className="home-container">
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Unlock Exclusive <span className="highlight">Rewards</span>
                    </h1>
                    <p className="hero-subtitle">
                        Join our loyalty program today. Earn points for every interaction and redeem them for amazing experiences.
                    </p>
                    <div className="hero-btns">
                        <Link to="/login" className="btn btn-primary">
                            Get Started
                        </Link>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="floating-card card-1">
                        <i className="fas fa-gift"></i>
                        <span>Rewards</span>
                    </div>
                    <div className="floating-card card-2">
                        <i className="fas fa-calendar-alt"></i>
                        <span>Events</span>
                    </div>
                    <div className="floating-card card-3">
                        <i className="fas fa-star"></i>
                        <span>Points</span>
                    </div>
                </div>
            </section>

            <section className="features-section">
                <h2 className="section-title">Why Join Us?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <i className="fas fa-coins"><PiHandCoinsDuotone /></i>
                        </div>
                        <h3>Earn Points</h3>
                        <p>Collect points with every purchase and participation.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <i className="fas fa-trophy"><FaTrophy /></i>
                        </div>
                        <h3>Exclusive Events</h3>
                        <p>Get VIP access to members-only events and parties.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <i className="fas fa-gift"><FaGifts /></i>
                        </div>
                        <h3>Redeem Rewards</h3>
                        <p>Exchange your points for exciting gifts and vouchers.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
