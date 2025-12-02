import React from 'react';
import './QRCode.css';

const QRCode = ({ data, label, description, className }) => {

    if (!data) return null;

    const qrUrl = data
        ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`
        : null;

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
