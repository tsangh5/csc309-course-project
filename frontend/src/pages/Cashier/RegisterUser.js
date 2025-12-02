import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterUserForm from '../../components/Forms/RegisterUserForm';
import './Cashier.css';

const RegisterUser = () => {
    const navigate = useNavigate();
    const [activationData, setActivationData] = React.useState(null);

    const handleSuccess = (user) => {
        if (user.resetToken) {
            setActivationData({
                token: user.resetToken,
                link: `${window.location.origin}/activate?token=${user.resetToken}&utorid=${user.utorid}`,
                utorid: user.utorid
            });
        } else {
            alert(`User ${user.name} (${user.utorid}) registered successfully!`);
            navigate('/dashboard/cashier');
        }
    };

    const handleCancel = () => {
        navigate('/dashboard/cashier');
    };

    return (
        <div className="cashier-page">
            <div className="cashier-container">
                {activationData ? (
                    <div className="register-user-form">
                        <div className="alert-box success" style={{ padding: '15px', border: '1px solid green', borderRadius: '5px', backgroundColor: '#e6fffa' }}>
                            <h3 style={{ marginTop: 0 }}>User Created: {activationData.utorid}</h3>
                            <p><strong>Action Required:</strong> Copy this link to set the password:</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={activationData.link}
                                    style={{ flex: 1, padding: '5px' }}
                                />
                                <button onClick={() => {
                                    navigator.clipboard.writeText(activationData.link);
                                    alert('Copied to clipboard!');
                                }}>
                                    Copy
                                </button>
                            </div>
                            <button
                                className="btn-submit"
                                onClick={() => navigate('/dashboard/cashier')}
                                style={{ width: '100%' }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    <RegisterUserForm onSuccess={handleSuccess} onCancel={handleCancel} />
                )}
            </div>
        </div>
    );
};

export default RegisterUser;
