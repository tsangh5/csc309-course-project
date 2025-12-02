import React from 'react';
import './AvailablePoints.css';

const AvailablePoints = ({ points, className }) => {
    return (
        <div className={`available-points-container ${className || ''}`}>
            <h3 className="available-points-title">Available Points</h3>
            <div className="available-points-value">
                {points !== undefined ? points : '...'}
            </div>
            <p className="available-points-label">pts</p>
        </div>
    );
};

export default AvailablePoints;