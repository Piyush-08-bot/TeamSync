import { useState, useRef, useEffect } from "react";
import { Video, MoreVertical, User, BellOff, Trash2 } from "lucide-react";
import { useChannelStateContext } from 'stream-chat-react';
import { useStream } from '../contexts/StreamContext';
import './ChatHeader.css';

const ChatHeader = ({
    name,
    avatarUrl,
    online,
    onVoiceCall,
    onVideoCall,
    onShowVideoModal,
}) => {
    const { channel } = useChannelStateContext();
    const { chatClient, videoClient } = useStream();

    
    const members = Object.values(channel?.state?.members || {});
    const otherUser = members.find(m => m.user?.id !== chatClient?.userID);

    
    const displayName = name || otherUser?.user?.name || 'User';
    const displayAvatar = avatarUrl || otherUser?.user?.image;
    
    const isOnline = online !== undefined ? online : (otherUser?.user?.online || false);

    const [menuOpen, setMenuOpen] = useState(false);
    const [isStartingCall, setIsStartingCall] = useState(false);
    const menuRef = useRef(null);

    
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    
    useEffect(() => {
        console.log('ChatHeader mounted/updated');
        console.log('Video client status:', videoClient ? 'Available' : 'Not available');
        console.log('Channel status:', channel ? `Available (${channel.id})` : 'Not available');
    }, [videoClient, channel]);

    
    const handleVideoCall = async () => {
        console.log('Video button clicked');
        console.log('Video client available:', !!videoClient);
        console.log('Channel available:', !!channel);
        console.log('Channel ID:', channel?.id);

        if (!videoClient) {
            console.error('Video client not available');
            alert('Video service is not ready. Please wait a moment and try again.');
            return;
        }

        if (!channel) {
            console.error('Channel not available');
            alert('No active chat channel. Please select a chat first.');
            return;
        }

        
        if (onVideoCall) {
            console.log('Using custom onVideoCall handler');
            onVideoCall();
            return;
        }

        setIsStartingCall(true);

        try {
            
            const callId = `call-${channel.id}`;
            const callType = 'default';

            console.log('Creating call with ID:', callId);

            
            const call = videoClient.call(callType, callId);

            
            const callMembers = [
                { user_id: chatClient.userID },
                ...(otherUser ? [{ user_id: otherUser.user.id }] : [])
            ];

            console.log('Call members:', callMembers);

            
            await call.getOrCreate({
                data: {
                    members: callMembers,
                    custom: {
                        channelId: channel.id,
                        channelName: displayName,
                        callerName: chatClient.user?.name || 'User',
                        callerAvatar: chatClient.user?.image || ''
                    }
                }
            });

            console.log('Call created successfully');

            
            await call.ring();
            console.log('Ring sent to other members');

            
            await call.join();
            console.log('Joined call successfully, showing video modal');

            
            if (onShowVideoModal) {
                onShowVideoModal(callType, callId);
            }
        } catch (error) {
            console.error('Error starting video call:', error);
            alert(`Failed to start video call: ${error.message || 'Unknown error'}`);
        } finally {
            setIsStartingCall(false);
        }
    };

    return (
        <header className="chat-header">
            {}
            <div className="chat-header__left">
                {}
                <div className="chat-header__avatar-container">
                    <div className="chat-header__avatar">
                        {displayAvatar ? (
                            <img
                                src={displayAvatar}
                                alt={`${displayName} avatar`}
                            />
                        ) : (
                            <span className="chat-header__avatar-fallback">
                                {displayName.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>

                    {}
                    {isOnline && (
                        <div className="chat-header__status-indicator" aria-label="Online">
                            <span className="chat-header__status-ping"></span>
                            <span className="chat-header__status-dot"></span>
                        </div>
                    )}
                </div>

                {}
                <div className="chat-header__user-info">
                    <span className="chat-header__user-name">
                        {displayName}
                    </span>
                    <span className={`chat-header__user-status ${isOnline ? "chat-header__user-status--online" : "chat-header__user-status--offline"}`}>
                        {isOnline ? "Online" : "Offline"}
                    </span>
                </div>
            </div>

            {}
            <div className="chat-header__actions">
                {}
                <button
                    onClick={handleVideoCall}
                    aria-label="Start video call"
                    className="chat-header__button chat-header__button--video"
                    disabled={isStartingCall}
                    title={!videoClient ? 'Video service initializing...' : 'Start video call'}
                >
                    {isStartingCall ? (
                        <div className="chat-header__loading-spinner"></div>
                    ) : (
                        <Video style={{ width: '20px', height: '20px' }} />
                    )}
                </button>

                {}
                <div className="chat-header__menu-container" ref={menuRef}>
                    <button
                        aria-label="More options"
                        onClick={() => setMenuOpen(!menuOpen)}
                        className={`chat-header__button chat-header__button--more ${menuOpen ? "active" : ""}`}
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    {}
                    {menuOpen && (
                        <div className="chat-header__dropdown">
                            <div className="chat-header__dropdown-header">
                                User Actions
                            </div>
                            <button
                                className="chat-header__dropdown-item"
                                onClick={() => setMenuOpen(false)}
                            >
                                <User className="w-4 h-4" />
                                View Profile
                            </button>
                            <button
                                className="chat-header__dropdown-item"
                                onClick={() => setMenuOpen(false)}
                            >
                                <BellOff className="w-4 h-4" />
                                Mute Notifications
                            </button>

                            <div className="chat-header__dropdown-divider"></div>

                            <button
                                className="chat-header__dropdown-item chat-header__dropdown-item--danger"
                                onClick={() => setMenuOpen(false)}
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default ChatHeader;
