import React from 'react';
import { Link } from 'react-router-dom';
import { FaPencilAlt, FaRegTrashAlt } from "react-icons/fa";
import { MdLocalOffer } from "react-icons/md";
import './Promotions.css';

const PromotionCard = ({ promotion, canEdit, onDelete }) => {
    const formatDate = (dateString) => {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getTypeColor = (type) => {
        return type === 'automatic' ? '#10b981' : '#f59e0b';
    };

    const isActive = () => {
        const now = new Date();
        const start = new Date(promotion.startTime);
        const end = new Date(promotion.endTime);
        return now >= start && now <= end;
    };

    return (
        <div className="promotion-card">
            <div className="promotion-card-header" style={{ background: `linear-gradient(135deg, ${getTypeColor(promotion.type)} 0%, ${getTypeColor(promotion.type)}dd 100%)` }}>
                <span className="promotion-type-badge">
                    <MdLocalOffer /> {promotion.type}
                </span>
                {isActive() && (
                    <span className="promotion-active-badge">ACTIVE</span>
                )}
            </div>
            <div className="promotion-card-body">
                <h3 className="promotion-title">{promotion.name}</h3>
                <p className="promotion-description">{promotion.description}</p>

                <div className="promotion-details-grid">
                    {promotion.points && (
                        <div className="promo-detail-item">
                            <span className="detail-label">Points</span>
                            <span className="detail-value">{promotion.points}</span>
                        </div>
                    )}
                    {promotion.rate && (
                        <div className="promo-detail-item">
                            <span className="detail-label">Rate</span>
                            <span className="detail-value">{promotion.rate}x</span>
                        </div>
                    )}
                    {promotion.minSpending && (
                        <div className="promo-detail-item">
                            <span className="detail-label">Min Spend</span>
                            <span className="detail-value">${promotion.minSpending}</span>
                        </div>
                    )}
                </div>

                <div className="promotion-time-info">
                    {promotion.startTime && (
                        <p className="promo-time">
                            <strong>Starts:</strong> {formatDate(promotion.startTime)}
                        </p>
                    )}
                    <p className="promo-time">
                        <strong>Ends:</strong> {formatDate(promotion.endTime)}
                    </p>
                </div>
            </div>

            {canEdit && (
                <div className="promotion-card-footer">
                    <div className="promotion-actions">
                        <Link to={`/promotions/${promotion.id}/edit`} className="btn-icon edit">
                            <FaPencilAlt />
                        </Link>
                        <button className="btn-icon delete" onClick={() => onDelete(promotion.id)}>
                            <FaRegTrashAlt />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromotionCard;
