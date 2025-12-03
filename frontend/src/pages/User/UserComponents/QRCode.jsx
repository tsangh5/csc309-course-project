import React from 'react';
import './QRCode.css';

const QRCode = ({ label, description, className, data }) => {

    const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(BASE_URL + '/cashier/create-transaction/' + data.id)}`;

    return (
        <div className={`qrcode-container ${className || ''}`}>
            {label && <h3 className="qrcode-title">{label}</h3>}
            {qrUrl ? (
                <img
                    src={qrUrl}
                    alt="User QR Code"
                    className="qrcode-image"
                />
            ) : (
                <div className="qrcode-placeholder">
                    Loading QR...
                </div>
            )}
            {description && <p className="qrcode-description">{description}</p>}
        </div>
    );
};

export default QRCode;
