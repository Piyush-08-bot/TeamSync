import { Phone, PhoneOff } from 'lucide-react';
import './IncomingCallPopup.css';

const IncomingCallPopup = ({ callerName, callerAvatar, onAccept, onDecline }) => {
    return (
        <div className="incoming-call-overlay">
            <div className="incoming-call-popup">
                <div className="incoming-call-content">
                    {}
                    <div className="incoming-call-avatar">
                        {callerAvatar ? (
                            <img src={callerAvatar} alt={callerName} />
                        ) : (
                            <div className="incoming-call-avatar-fallback">
                                {callerName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        <div className="incoming-call-pulse"></div>
                    </div>

                    {}
                    <div className="incoming-call-info">
                        <h2>{callerName || 'Unknown'}</h2>
                        <p>Incoming video call...</p>
                    </div>

                    {}
                    <div className="incoming-call-actions">
                        <button
                            className="incoming-call-btn incoming-call-btn--decline"
                            onClick={onDecline}
                            aria-label="Decline call"
                        >
                            <PhoneOff size={24} />
                            <span>Decline</span>
                        </button>

                        <button
                            className="incoming-call-btn incoming-call-btn--accept"
                            onClick={onAccept}
                            aria-label="Accept call"
                        >
                            <Phone size={24} />
                            <span>Accept</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallPopup;
