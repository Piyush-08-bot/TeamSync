import { useState, useRef, useEffect, useMemo } from 'react';
import {
    Chat,
    Channel,
    MessageList,
    MessageInput,
    Window,
    TypingIndicator,
    useChannelStateContext
} from 'stream-chat-react';
import { useStream } from '../contexts/StreamContext';
import { useAuth } from '../contexts/AuthContext';
import AddUserModal from './AddUserModal';
import CreateGroupModal from './CreateGroupModal';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import InlineVideoCall from './InlineVideoCall';
import IncomingCallPopup from './IncomingCallPopup';
import { createDirectMessageChannel } from '../services/api';
import toast from 'react-hot-toast';
import 'stream-chat-react/dist/css/v2/index.css';
import '../styles/chat.css';


const StreamChatComponent = () => {
    const { chatClient, videoClient, isReady, loading: streamLoading } = useStream();
    const { authUser, isLoading: authLoading } = useAuth();

    const [activeChannel, setActiveChannel] = useState(null);
    const [showAddUser, setShowAddUser] = useState(false);
    const [showAddGroup, setShowAddGroup] = useState(false);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [videoCallInfo, setVideoCallInfo] = useState(null);
    const [showIncomingCall, setShowIncomingCall] = useState(false);
    const [incomingCallData, setIncomingCallData] = useState(null);

    
    useEffect(() => {
        console.log('showIncomingCall changed:', showIncomingCall);
        console.log('incomingCallData:', incomingCallData);
    }, [showIncomingCall, incomingCallData]);
    const [channelListKey, setChannelListKey] = useState(0);

    
    const filters = useMemo(() => {
        const userID = chatClient?.userID;
        if (!userID) return {};
        return {
            type: 'messaging',
            members: { $in: [userID] }
        };
    }, [chatClient?.userID]);

    const sort = useMemo(() => ({ last_message_at: -1 }), []);
    const options = useMemo(() => ({ presence: true, state: true, watch: true }), []);

    
    useEffect(() => {
        if (!chatClient) return;

        const handleMessageNew = () => {
            setChannelListKey(prev => prev + 1);
        };

        const handleChannelUpdated = () => {
            setChannelListKey(prev => prev + 1);
        };

        chatClient.on('message.new', handleMessageNew);
        chatClient.on('channel.updated', handleChannelUpdated);

        return () => {
            chatClient.off('message.new', handleMessageNew);
            chatClient.off('channel.updated', handleChannelUpdated);
        };
    }, [chatClient]);

    
    useEffect(() => {
        
        if (!videoClient || !isReady) {
            console.log('VideoClient not ready for event listeners', {
                hasVideoClient: !!videoClient,
                isReady
            });
            return;
        }

        console.log('Setting up video call event listeners');
        console.log('Current user ID:', chatClient?.userID);
        console.log('Video client user:', videoClient.user);
        console.log('System is ready, registering event listeners');

        const handleIncomingCall = async (event) => {
            const timestamp = new Date().toISOString();
            console.log(`=== INCOMING CALL EVENT [${timestamp}] ===`);
            console.log('Full event:', event);
            console.log('Event type:', event.type);

            
            const call = event.call;

            if (!call) {
                console.error('No call object in event');
                return;
            }

            
            const createdById = call.state?.createdBy?.id;
            if (createdById === chatClient?.userID) {
                console.log('Ignoring ring event - we created this call');
                return;
            }

            
            if (showIncomingCall) {
                console.log('Incoming call popup already showing, ignoring duplicate event');
                return;
            }

            const callType = call.type;
            const callId = call.id;
            const customData = call.state?.custom || {};

            console.log('Call Type:', callType);
            console.log('Call ID:', callId);
            console.log('Custom data:', customData);
            console.log('Call state:', call.state);
            console.log('Call members:', call.state?.members);
            console.log('Created by:', call.state?.createdBy);

            
            let callerName = 'Unknown';
            let callerAvatar = '';

            
            if (customData.callerName) {
                callerName = customData.callerName;
                callerAvatar = customData.callerAvatar || '';
                console.log('Got caller from custom data:', callerName);
            }
            
            else if (call.state?.createdBy) {
                callerName = call.state.createdBy.name || call.state.createdBy.id;
                callerAvatar = call.state.createdBy.image || '';
                console.log('Got caller from createdBy:', callerName);
            }
            
            else if (call.state?.members) {
                const members = Object.values(call.state.members);
                const caller = members.find(m => m.user_id !== chatClient?.userID);
                if (caller) {
                    callerName = caller.user?.name || caller.user_id;
                    callerAvatar = caller.user?.image || '';
                    console.log('Got caller from members:', callerName);
                }
            }
            
            else {
                console.log('Trying to get caller info from chat client');
                
                const creatorId = call.state?.createdBy?.id;
                if (creatorId && chatClient) {
                    try {
                        
                        const users = await chatClient.queryUsers({ id: creatorId });
                        if (users.users && users.users.length > 0) {
                            const user = users.users[0];
                            callerName = user.name || user.id;
                            callerAvatar = user.image || '';
                            console.log('Got caller from chat client query:', callerName);
                        }
                    } catch (error) {
                        console.error('Error querying user:', error);
                    }
                }
            }

            console.log('Caller Name:', callerName);
            console.log('Caller Avatar:', callerAvatar);

            
            const popupTimestamp = new Date().toISOString();
            console.log(`[${popupTimestamp}] Setting incoming call state:`, {
                callType,
                callId,
                callerName,
                callerAvatar
            });

            setIncomingCallData({
                callType,
                callId,
                callerName,
                callerAvatar,
                call 
            });
            setShowIncomingCall(true);
            console.log(`[${popupTimestamp}] Incoming call popup state updated - should now be visible`);
        };

        const handleCallEnded = (event) => {
            const timestamp = new Date().toISOString();
            console.log(`=== CALL ENDED EVENT [${timestamp}] ===`);
            console.log('Event:', event);
            
            setShowIncomingCall(false);
            setIncomingCallData(null);
            console.log(`[${timestamp}] Incoming call popup closed`);
        };

        
        
        const registrationTimestamp = new Date().toISOString();
        videoClient.on('call.ring', handleIncomingCall);
        videoClient.on('call.ended', handleCallEnded);
        videoClient.on('call.rejected', handleCallEnded);

        console.log(`[${registrationTimestamp}] Video call event listeners registered successfully`);

        return () => {
            const cleanupTimestamp = new Date().toISOString();
            console.log(`[${cleanupTimestamp}] Removing video call event listeners`);
            videoClient.off('call.ring', handleIncomingCall);
            videoClient.off('call.ended', handleCallEnded);
            videoClient.off('call.rejected', handleCallEnded);
            console.log(`[${cleanupTimestamp}] Event listeners removed`);
        };
    }, [videoClient, isReady, chatClient?.userID, showIncomingCall]);

    
    const handleShowVideoCall = (callType, callId) => {
        setVideoCallInfo({ callType, callId });
        setShowVideoCall(true);
    };

    const handleCloseVideoCall = () => {
        setShowVideoCall(false);
        setVideoCallInfo(null);
    };

    const handleMinimizeVideoCall = () => {
        
        console.log('Minimize video call');
    };

    
    const handleAcceptCall = async () => {
        if (incomingCallData) {
            console.log('Accepting call:', incomingCallData.callId);

            
            setShowIncomingCall(false);

            
            handleShowVideoCall(incomingCallData.callType, incomingCallData.callId);

            
            setIncomingCallData(null);

            toast.success('Call accepted');
        }
    };

    
    const handleDeclineCall = async () => {
        if (incomingCallData?.call) {
            console.log('Declining call:', incomingCallData.callId);
            try {
                await incomingCallData.call.reject();
                toast.error('Call declined');
            } catch (error) {
                console.error('Error rejecting call:', error);
                toast.error('Failed to decline call');
            }
        }
        setShowIncomingCall(false);
        setIncomingCallData(null);
    };

    
    const handleChannelCreated = (channel) => {
        setActiveChannel(channel);
        setShowAddUser(false);
        setShowAddGroup(false);
        
        setChannelListKey(prev => prev + 1);
        
        setTimeout(() => {
            setChannelListKey(prev => prev + 1);
        }, 500);
    };

    
    const handleGroupCreated = (channel) => {
        setActiveChannel(channel);
        setShowAddGroup(false);
        setChannelListKey(prev => prev + 1);
    };

    
    const handleDeleteChannel = async (channel) => {
        try {
            await channel.delete();
            toast.success('Conversation deleted successfully');

            
            if (activeChannel?.id === channel.id || activeChannel?.cid === channel.cid) {
                setActiveChannel(null);
            }

            
            setChannelListKey(prev => prev + 1);
            setTimeout(() => {
                setChannelListKey(prev => prev + 1);
            }, 300);
        } catch (error) {
            console.error('Failed to delete channel:', error);
            toast.error('Failed to delete conversation');
        }
    };

    
    if (authLoading || streamLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!authUser || !chatClient || !isReady || !chatClient.userID) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Initializing chat...</p>
            </div>
        );
    }

    const userInitials = authUser?.name
        ? authUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : 'U';

    return (
        <>
            {}
            {showIncomingCall && incomingCallData && (
                <IncomingCallPopup
                    callerName={incomingCallData.callerName}
                    callerAvatar={incomingCallData.callerAvatar}
                    onAccept={handleAcceptCall}
                    onDecline={handleDeclineCall}
                />
            )}

            <div className="chat-container">
                <Chat client={chatClient} theme="str-chat__theme-dark">
                    {}
                    <ChatSidebar
                        activeChannel={activeChannel}
                        setActiveChannel={setActiveChannel}
                        onAddUser={() => setShowAddUser(true)}
                        onAddGroup={() => setShowAddGroup(true)}
                        channelListKey={channelListKey}
                        filters={filters}
                        sort={sort}
                        options={options}
                        onDeleteChannel={handleDeleteChannel}
                    />

                    {}
                    <div className={`chat-main-area ${showVideoCall ? 'split-layout' : ''}`}>
                        {}
                        <div className={`chat-window-container ${showVideoCall ? 'split-view' : ''}`}>
                            {activeChannel ? (
                                <Channel channel={activeChannel}>
                                    <Window>
                                        <ChatHeader
                                            onVoiceCall={() => toast.info('Voice call coming soon')}
                                            onShowVideoModal={handleShowVideoCall}
                                        />

                                        <MessageList
                                            TypingIndicator={TypingIndicator}
                                            messageLimit={50}
                                        />
                                        <MessageInput grow publishTypingEvent />
                                    </Window>
                                </Channel>
                            ) : (
                                <div className="empty-chat-state">
                                    <div className="empty-chat-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                        </svg>
                                    </div>
                                    <h3>Select a conversation</h3>
                                    <p>Choose a conversation from the sidebar or start a new chat</p>
                                    <button
                                        className="start-chat-btn"
                                        onClick={() => setShowAddUser(true)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Start New Chat
                                    </button>
                                </div>
                            )}
                        </div>

                        {}
                        {showVideoCall && videoCallInfo && (
                            <div className="video-panel">
                                <InlineVideoCall
                                    callType={videoCallInfo.callType}
                                    callId={videoCallInfo.callId}
                                    onClose={handleCloseVideoCall}
                                    onMinimize={handleMinimizeVideoCall}
                                />
                            </div>
                        )}
                    </div>
                </Chat>

                {}
                {showAddUser && (
                    <AddUserModal
                        onClose={() => setShowAddUser(false)}
                        onChannelCreated={handleChannelCreated}
                    />
                )}

                {}
                {showAddGroup && (
                    <CreateGroupModal
                        onClose={() => setShowAddGroup(false)}
                        onGroupCreated={handleGroupCreated}
                    />
                )}
            </div>
        </>
    );
};

export default StreamChatComponent;
