import { PhoneOff } from 'lucide-react';
import './CallEndedPopup.css';

const CallEndedPopup = ({ onClose }) => {
    return (
        <div className="call-ended-overlay">
            <div className="call-ended-popup">
                <div className="call-ended-content">
                    {}
                    <div className="call-ended-icon">
                        <PhoneOff size={48} />
                    </div>

                    {}
                    <div className="call-ended-info">
                        <h2>Call Ended</h2>
                        <p>The other participant has ended the call</p>
                    </div>

                    {}
                    <button
                        className="call-ended-btn"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CallEndedPopup;
