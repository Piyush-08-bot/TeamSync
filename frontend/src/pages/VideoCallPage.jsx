import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStream } from '../contexts/StreamContext';
import {
  StreamCall,
  StreamVideo,
  StreamTheme,
  CallControls,
  SpeakerLayout,
  CallParticipantsList,
  useCallStateHooks
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import './VideoCallPage.css';

const VideoCallUI = ({ call }) => {
  const navigate = useNavigate();
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();

  const handleLeaveCall = async () => {
    try {
      await call.leave();
      navigate('/');
    } catch (error) {
      console.error('Error leaving call:', error);
      navigate('/');
    }
  };

  if (callingState === 'left') {
    navigate('/');
    return null;
  }

  return (
    <div className="video-call-ui">
      <div className="video-call-header">
        <h3 className="video-call-title">Video Call</h3>
        <div className="video-call-info">
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="video-call-content">
        <SpeakerLayout />
      </div>

      <div className="video-call-controls">
        <CallControls onLeave={handleLeaveCall} />
      </div>

      <div className="video-call-sidebar">
        <CallParticipantsList onClose={() => { }} />
      </div>
    </div>
  );
};

const VideoCallPage = () => {
  const { callType, callId } = useParams();
  const { videoClient, isReady, loading, error } = useStream();
  const navigate = useNavigate();
  const [call, setCall] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [callError, setCallError] = useState(null);

  useEffect(() => {
    if (!callType || !callId || !videoClient || !isReady) {
      return;
    }

    const joinCall = async () => {
      setIsJoining(true);
      setCallError(null);

      try {
        const newCall = videoClient.call(callType, callId);
        await newCall.join({ create: false });
        setCall(newCall);
      } catch (err) {
        console.error('Error joining call:', err);
        setCallError(err.message || 'Failed to join call');
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
  }, [callType, callId, videoClient, isReady]);

  if (loading || isJoining) {
    return (
      <div className="video-call-page">
        <div className="video-call-loading">
          <div className="loading-spinner"></div>
          <p>{isJoining ? 'Joining call...' : 'Initializing video services...'}</p>
        </div>
      </div>
    );
  }

  if (error || callError) {
    return (
      <div className="video-call-page">
        <div className="video-call-error">
          <h2>Connection Error</h2>
          <p>{error || callError}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  if (!isReady || !videoClient) {
    return (
      <div className="video-call-page">
        <div className="video-call-loading">
          <h2>Video Call Setup</h2>
          <p>Video services are initializing...</p>
        </div>
      </div>
    );
  }

  if (!callType || !callId) {
    return (
      <div className="video-call-page">
        <div className="video-call-error">
          <h2>Invalid Call</h2>
          <p>No call information provided.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="video-call-page">
        <div className="video-call-loading">
          <div className="loading-spinner"></div>
          <p>Setting up call...</p>
        </div>
      </div>
    );
  }

  return (
    <StreamVideo client={videoClient}>
      <StreamTheme>
        <StreamCall call={call}>
          <VideoCallUI call={call} />
        </StreamCall>
      </StreamTheme>
    </StreamVideo>
  );
};

export default VideoCallPage;