import { useEffect, useState, useMemo } from 'react';
import { useStream } from '../contexts/StreamContext';
import {
    StreamCall,
    StreamVideo,
    StreamTheme,
    CallControls,
    ParticipantView,
    useCallStateHooks
} from '@stream-io/video-react-sdk';
import { X, Minimize2 } from 'lucide-react';
import CallEndedPopup from './CallEndedPopup';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import './InlineVideoCall.css';

const VideoCallUI = ({ call, onClose, onMinimize }) => {
    const { useCallCallingState, useParticipants, useRemoteParticipants, useHasOngoingScreenShare } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants();
    const remoteParticipants = useRemoteParticipants();
    const hasScreenShare = useHasOngoingScreenShare();
    const [forceUpdate, setForceUpdate] = useState(0);
    const [showCallEndedPopup, setShowCallEndedPopup] = useState(false);
    const [userEndedCall, setUserEndedCall] = useState(false);

    
    const manualScreenShareCheck = useMemo(() => {
        if (!participants || participants.length === 0) return false;

        const hasScreenShareParticipant = participants.some(participant => {
            const hasTrack = participant.publishedTracks?.includes('screenShareTrack');
            const hasStream = !!participant.screenShareStream;
            const isSharing = participant.isScreenSharing;

            if (hasTrack || hasStream || isSharing) {
                console.log('🖥️ Found screen share from participant:', {
                    userId: participant.userId,
                    name: participant.name,
                    hasTrack,
                    hasStream,
                    isSharing,
                    publishedTracks: participant.publishedTracks
                });
                return true;
            }
            return false;
        });

        return hasScreenShareParticipant;
    }, [participants, forceUpdate]);

    
    const isScreenSharing = hasScreenShare || manualScreenShareCheck;

    
    useEffect(() => {
        console.log('🖥️ Screen share status:', {
            hasScreenShare_SDK: hasScreenShare,
            hasScreenShare_Manual: manualScreenShareCheck,
            finalIsScreenSharing: isScreenSharing,
            participantCount: participants?.length,
            remoteParticipantCount: remoteParticipants?.length,
            allParticipants: participants?.map(p => ({
                userId: p.userId,
                name: p.name,
                publishedTracks: p.publishedTracks
            }))
        });
    }, [hasScreenShare, manualScreenShareCheck, isScreenSharing, participants?.length, remoteParticipants?.length, participants]);

    
    useEffect(() => {
        if (!call) return;

        const handleScreenShareStarted = (event) => {
            console.log('🖥️ Screen share started event:', event);
            console.log('🖥️ Event details:', {
                type: event.type,
                user: event.user,
                call_cid: event.call_cid
            });
            setForceUpdate(prev => prev + 1); 
        };

        const handleScreenShareStopped = (event) => {
            console.log('🖥️ Screen share stopped event:', event);
            setForceUpdate(prev => prev + 1); 
        };

        const handleTrackPublished = (event) => {
            console.log('📡 Track published event:', event);
            if (event.type?.includes('screen')) {
                console.log('📡 Screen share track published!');
                setForceUpdate(prev => prev + 1);
            }
        };

        const handleTrackUnpublished = (event) => {
            console.log('📡 Track unpublished event:', event);
            if (event.type?.includes('screen')) {
                console.log('📡 Screen share track unpublished!');
                setForceUpdate(prev => prev + 1);
            }
        };

        call.on('call.screen_share_started', handleScreenShareStarted);
        call.on('call.screen_share_stopped', handleScreenShareStopped);
        call.on('call.track_published', handleTrackPublished);
        call.on('call.track_unpublished', handleTrackUnpublished);

        return () => {
            call.off('call.screen_share_started', handleScreenShareStarted);
            call.off('call.screen_share_stopped', handleScreenShareStopped);
            call.off('call.track_published', handleTrackPublished);
            call.off('call.track_unpublished', handleTrackUnpublished);
        };
    }, [call]);

    
    useEffect(() => {
        if (!call) return;

        const handleParticipantLeft = (event) => {
            console.log('Participant left event:', event);

            
            setForceUpdate(prev => prev + 1);

            
            
            setTimeout(() => {
                const currentParticipants = call.state.participants;
                console.log('Current participants after leave:', currentParticipants.length);

                
                if (currentParticipants.length <= 1) {
                    console.log('Only one participant left');

                    if (!userEndedCall) {
                        console.log('Other user left, showing popup');
                        setShowCallEndedPopup(true);
                        
                    } else {
                        console.log('Current user ended call, closing directly');
                        onClose();
                    }
                }
            }, 500); 
        };

        call.on('call.session_participant_left', handleParticipantLeft);

        return () => {
            call.off('call.session_participant_left', handleParticipantLeft);
        };
    }, [call, onClose, userEndedCall]);

    
    const displayParticipants = useMemo(() => {
        if (!participants || participants.length === 0) {
            return [];
        }

        
        const participantMap = new Map();

        for (const participant of participants) {
            const userId = participant.userId;

            if (!userId) {
                console.warn('Participant without userId:', participant);
                continue;
            }

            
            if (!participantMap.has(userId)) {
                participantMap.set(userId, participant);
            }
        }

        const uniqueParticipants = Array.from(participantMap.values());

        if (uniqueParticipants.length !== participants.length) {
            console.log(`Deduplicated: ${participants.length} -> ${uniqueParticipants.length} participants`);
        }

        return uniqueParticipants;
    }, [participants, forceUpdate]);

    const handleLeaveCall = async () => {
        try {
            console.log('Ending call for everyone and stopping tracks...');

            
            setUserEndedCall(true);

            
            const localParticipant = call.state.localParticipant;
            if (localParticipant) {
                
                if (localParticipant.videoStream) {
                    localParticipant.videoStream.getTracks().forEach(track => {
                        track.stop();
                        console.log('Stopped video track');
                    });
                }

                
                if (localParticipant.audioStream) {
                    localParticipant.audioStream.getTracks().forEach(track => {
                        track.stop();
                        console.log('Stopped audio track');
                    });
                }
            }

            
            
            try {
                await call.endCall();
                console.log('Call ended for everyone');
            } catch (endError) {
                console.log('Could not end call, leaving instead:', endError.message);
                
                await call.leave();
                console.log('Left call successfully');
            }

            onClose();
        } catch (error) {
            console.error('Error ending call:', error);
            onClose();
        }
    };

    
    useEffect(() => {
        if (callingState === 'left') {
            console.log('Call state is left');

            
            
            if (userEndedCall) {
                console.log('Current user left, closing UI');
                onClose();
            } else {
                console.log('Other user ended call, popup should be showing');
                
            }
        }
    }, [callingState, onClose, userEndedCall]);

    
    useEffect(() => {
        if (!call) return;

        const handleCallEnded = (event) => {
            console.log('Call ended event received:', event);

            
            
            if (!userEndedCall) {
                console.log('Other user ended the call, showing popup');
                setShowCallEndedPopup(true);
                
            } else {
                
                console.log('Current user ended the call, closing directly');
                onClose();
            }
        };

        call.on('call.ended', handleCallEnded);

        return () => {
            call.off('call.ended', handleCallEnded);
        };
    }, [call, onClose, userEndedCall]);

    
    const handlePopupClose = () => {
        setShowCallEndedPopup(false);
        onClose();
    };

    return (
        <>
            {}
            {showCallEndedPopup && (
                <CallEndedPopup onClose={handlePopupClose} />
            )}

            <div className="inline-video-call">
                {}
                <div className="inline-video-header">
                    <div className="inline-video-info">
                        <div className="inline-video-indicator"></div>
                        <span>Video Call • {displayParticipants.length} participant{displayParticipants.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="inline-video-actions">
                        {onMinimize && (
                            <button
                                className="inline-video-btn"
                                onClick={onMinimize}
                                aria-label="Minimize"
                                title="Minimize"
                            >
                                <Minimize2 size={18} />
                            </button>
                        )}
                        <button
                            className="inline-video-btn inline-video-btn--close"
                            onClick={handleLeaveCall}
                            aria-label="End call"
                            title="End call"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {}
                <div className="inline-video-content">
                    {}
                    {isScreenSharing ? (
                        <div className="video-grid-container has-screen-share">
                            {}
                            <div className="screen-share-section">
                                {console.log('🖥️ Rendering screen share section for ALL participants')}
                                {}
                                {displayParticipants.map((participant) => {
                                    console.log('🖥️ Attempting to render screen share for:', participant.userId, participant.name);
                                    return (
                                        <div key={`screenshare-${participant.userId}`} className="screen-share-tile">
                                            <ParticipantView
                                                participant={participant}
                                                ParticipantViewUI={null}
                                                trackType="screenShareTrack"
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {}
                            <div className="participants-grid with-screen-share">
                                {displayParticipants.map((participant) => (
                                    <div key={participant.userId} className="participant-tile">
                                        <ParticipantView
                                            participant={participant}
                                            ParticipantViewUI={null}
                                            trackType="videoTrack"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        
                        <div className="video-grid-container">
                            <div className="participants-grid">
                                {displayParticipants.map((participant) => (
                                    <div key={participant.userId} className="participant-tile">
                                        <ParticipantView
                                            participant={participant}
                                            ParticipantViewUI={null}
                                            trackType="videoTrack"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {}
                <div className="inline-video-controls">
                    <CallControls onLeave={handleLeaveCall} />
                </div>
            </div>
        </>
    );
};

const InlineVideoCall = ({ callType, callId, onClose, onMinimize }) => {
    const { videoClient } = useStream();
    const [call, setCall] = useState(null);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!callType || !callId || !videoClient) {
            return;
        }

        let isMounted = true;

        const setupCall = async () => {
            setIsJoining(true);
            setError(null);

            try {
                const newCall = videoClient.call(callType, callId);

                
                try {
                    await newCall.get();
                    console.log('Got call info');
                } catch (getError) {
                    console.log('Could not get call, will create:', getError.message);
                }

                
                const currentState = newCall.state?.callingState;
                console.log('Current calling state:', currentState);

                
                if (currentState !== 'joined' && currentState !== 'joining') {
                    try {
                        
                        await newCall.join({
                            create: true,
                            data: {
                                
                                subscribe_to_screen_share: true
                            }
                        });
                        console.log('Joined call successfully with screen share subscription');
                    } catch (joinError) {
                        console.log('Join error:', joinError.message);
                        
                        if (!joinError.message?.includes('already joined')) {
                            throw joinError;
                        }
                    }
                } else {
                    console.log('Already in call, skipping join');
                }

                
                try {
                    console.log('Setting up track subscriptions...');
                    
                    
                    if (newCall.state) {
                        console.log('Call state available, tracks should be subscribed');
                    }
                } catch (subError) {
                    console.warn('Error setting up subscriptions:', subError);
                }

                if (isMounted) {
                    setCall(newCall);
                }
            } catch (err) {
                console.error('Error setting up call:', err);
                if (isMounted) {
                    setError(err.message || 'Failed to join call');
                }
            } finally {
                if (isMounted) {
                    setIsJoining(false);
                }
            }
        };

        setupCall();

        return () => {
            isMounted = false;
        };
    }, [callType, callId, videoClient]);

    
    useEffect(() => {
        return () => {
            
            if (call) {
                console.log('Component unmounting, cleaning up call...');

                
                const localParticipant = call.state?.localParticipant;
                if (localParticipant) {
                    if (localParticipant.videoStream) {
                        localParticipant.videoStream.getTracks().forEach(track => {
                            track.stop();
                            console.log('Cleanup: Stopped video track');
                        });
                    }
                    if (localParticipant.audioStream) {
                        localParticipant.audioStream.getTracks().forEach(track => {
                            track.stop();
                            console.log('Cleanup: Stopped audio track');
                        });
                    }
                }

                
                call.leave().catch(err => {
                    console.error('Error leaving call on unmount:', err);
                });
            }
        };
    }, [call]);

    if (isJoining) {
        return (
            <div className="inline-video-loading">
                <div className="loading-spinner"></div>
                <p>Joining call...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="inline-video-error">
                <p>{error}</p>
                <button onClick={onClose} className="btn-close">Close</button>
            </div>
        );
    }

    if (!call) {
        return (
            <div className="inline-video-loading">
                <div className="loading-spinner"></div>
                <p>Setting up call...</p>
            </div>
        );
    }

    return (
        <StreamVideo client={videoClient}>
            <StreamTheme>
                <StreamCall call={call}>
                    <VideoCallUI call={call} onClose={onClose} onMinimize={onMinimize} />
                </StreamCall>
            </StreamTheme>
        </StreamVideo>
    );
};

export default InlineVideoCall;
