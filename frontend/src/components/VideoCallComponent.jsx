import { useState, useEffect } from 'react';
import {
    Call,
    StreamVideo,
    CallControls,
    ParticipantView,
    useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useStream } from '../contexts/StreamContext';
import '../styles/video-call.css';

const VideoCallComponent = ({ callId, onEndCall }) => {
    const { videoClient } = useStream();
    const [call, setCall] = useState(null);
    const [isJoining, setIsJoining] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!videoClient || !callId) return;

        const newCall = videoClient.call('default', callId);
        setCall(newCall);

        const joinCall = async () => {
            try {
                setIsJoining(true);
                await newCall.join({ create: true });
                setIsJoining(false);
            } catch (err) {
                console.error('Error joining call:', err);
                setError('Failed to join call');
                setIsJoining(false);
            }
        };

        joinCall();

        return () => {
            if (newCall) {
                newCall.leave();
            }
        };
    }, [videoClient, callId]);

    if (!videoClient) {
        return (
            <div className="video-call-error">
                <p>Video client not initialized</p>
                <button onClick={onEndCall} className="btn-primary">Close</button>
            </div>
        );
    }

    if (error) {
        return (
            <div className="video-call-error">
                <p>{error}</p>
                <button onClick={onEndCall} className="btn-primary">Close</button>
            </div>
        );
    }

    if (isJoining || !call) {
        return (
            <div className="video-call-loading">
                <div className="loading-spinner"></div>
                <p>Joining call...</p>
            </div>
        );
    }

    return (
        <div className="video-call-wrapper">
            <StreamVideo client={videoClient}>
                <Call call={call}>
                    <VideoCallUI onEndCall={onEndCall} />
                </Call>
            </StreamVideo>
        </div>
    );
};


const VideoCallUI = ({ onEndCall }) => {
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();

    return (
        <>
            <div className="video-call-participants">
                {participants.length > 0 ? (
                    participants.map((participant) => (
                        <ParticipantView key={participant.sessionId} participant={participant} />
                    ))
                ) : (
                    <div className="no-participants">
                        <p>Waiting for participants...</p>
                    </div>
                )}
            </div>
            <div className="video-call-controls-container">
                <CallControls onLeave={onEndCall} />
            </div>
        </>
    );
};

export default VideoCallComponent;

