import { useEffect, useState } from 'react';
import { useStream } from '../contexts/StreamContext';
import {
    StreamCall,
    StreamVideo,
    StreamTheme,
    CallControls,
    SpeakerLayout,
    useCallStateHooks
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import './VideoCallModal.css';

const VideoCallUI = ({ call, onClose }) => {
    const { useCallCallingState, useParticipants } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants();

    const handleLeaveCall = async () => {
        try {
            await call.leave();
            onClose();
        } catch (error) {
            console.error('Error leaving call:', error);
            onClose();
        }
    };

    useEffect(() => {
        if (callingState === 'left') {
            onClose();
        }
    }, [callingState, onClose]);

    return (
        <div className="video-call-modal-content">
            <div className="video-call-modal-header">
                <div className="video-call-modal-info">
                    <h3>Video Call</h3>
                    <span>{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
                </div>
                <button
                    className="video-call-modal-close"
                    onClick={handleLeaveCall}
                    aria-label="Close video call"
                >
                    ×
                </button>
            </div>

            <div className="video-call-modal-video">
                <SpeakerLayout />
            </div>

            <div className="video-call-modal-controls">
                <CallControls onLeave={handleLeaveCall} />
            </div>
        </div>
    );
};

const VideoCallModal = ({ callType, callId, onClose }) => {
    const { videoClient } = useStream();
    const [call, setCall] = useState(null);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Default to 'default' call type if not provided
        const effectiveCallType = callType || 'default';
        
        if (!effectiveCallType || !callId || !videoClient) {
            return;
        }

        const joinCall = async () => {
            setIsJoining(true);
            setError(null);

            try {
                const newCall = videoClient.call(effectiveCallType, callId);

                
                // Try to join the call first
                try {
                    await newCall.join({ create: true });
                } catch (joinError) {
                    // If joining fails, try to get or create the call
                    console.log('Join failed, trying to get or create call:', joinError);
                    await newCall.getOrCreate();
                    await newCall.join();
                }

                setCall(newCall);
            } catch (err) {
                console.error('Error joining call:', err);
                setError(err.message || 'Failed to join call');
            } finally {
                setIsJoining(false);
            }
        };

        joinCall();

        return () => {
            if (call) {
                call.leave().catch(err => console.error('Error leaving call on unmount:', err));
            }
        };
    }, [callType, callId, videoClient]);

    if (isJoining) {
        return (
            <div className="video-call-modal-overlay">
                <div className="video-call-modal">
                    <div className="video-call-modal-loading">
                        <div className="loading-spinner"></div>
                        <p>Joining call...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="video-call-modal-overlay">
                <div className="video-call-modal">
                    <div className="video-call-modal-error">
                        <h2>Connection Error</h2>
                        <p>{error}</p>
                        <button onClick={onClose} className="btn-primary">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!call) {
        return (
            <div className="video-call-modal-overlay">
                <div className="video-call-modal">
                    <div className="video-call-modal-loading">
                        <div className="loading-spinner"></div>
                        <p>Setting up call...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="video-call-modal-overlay" onClick={onClose}>
            <div className="video-call-modal" onClick={(e) => e.stopPropagation()}>
                <StreamVideo client={videoClient}>
                    <StreamTheme>
                        <StreamCall call={call}>
                            <VideoCallUI call={call} onClose={onClose} />
                        </StreamCall>
                    </StreamTheme>
                </StreamVideo>
            </div>
        </div>
    );
};

export default VideoCallModal;
