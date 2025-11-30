import React from 'react';
import './AvailablePoints.css';

const AvailablePoints = ({ points }) => {
    return (
        <div className="available-points-container">
            <h3 className="available-points-title">Available Points</h3>
            <div className="available-points-value">
                {points !== undefined ? points : '...'}
            </div>
            <p className="available-points-label">pts</p>
        </div>
    );
};

export default AvailablePoints;
