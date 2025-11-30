import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
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
                        <Link to="/events" className="btn btn-outline">
                            Explore Events
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
                            <i className="fas fa-coins"></i>
                        </div>
                        <h3>Earn Points</h3>
                        <p>Collect points with every purchase and participation.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <i className="fas fa-ticket-alt"></i>
                        </div>
                        <h3>Exclusive Events</h3>
                        <p>Get VIP access to members-only events and parties.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <i className="fas fa-gift"></i>
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
