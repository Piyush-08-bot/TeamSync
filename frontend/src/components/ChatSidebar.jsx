import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChannelList } from 'stream-chat-react';
import { useStream } from '../contexts/StreamContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import '../styles/sidebar.css';


const Users = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
);


const ChannelPreview = ({ channel, active, setActiveChannel, chatClient, isGroup = false, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const members = Object.values(channel.state?.members || {});
    const otherMember = members.find(m => m.user?.id !== chatClient?.userID);
    const isOnline = otherMember?.user?.online || false;
    const unreadCount = channel.countUnread();
    const isUnread = unreadCount > 0;

    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    
    const lastMessage = channel.state?.messages?.[channel.state.messages.length - 1];
    let messagePreview = '';
    if (lastMessage) {
        if (lastMessage.text) {
            messagePreview = lastMessage.text;
        } else if (lastMessage.attachments?.length > 0) {
            messagePreview = '📎 Attachment';
        } else {
            messagePreview = 'Message';
        }
    }

    
    if (messagePreview.length > 35) {
        messagePreview = messagePreview.substring(0, 35) + '...';
    }

    
    const formatTime = (date) => {
        if (!date) return '';
        const now = new Date();
        const msgDate = new Date(date);
        const diffMs = now - msgDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d`;
        return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const lastMessageTime = channel.state?.last_message_at || channel.created_at;
    const timeDisplay = formatTime(lastMessageTime);

    
    let title = '';
    let initials = 'G';

    if (isGroup) {
        title = channel.data?.name || 'Group Chat';
        initials = title.charAt(0).toUpperCase();
    } else {
        title = otherMember?.user?.name || 'User';
        initials = title.charAt(0).toUpperCase();
    }

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete this ${isGroup ? 'group' : 'conversation'}?`)) {
            if (onDelete) {
                await onDelete(channel);
            }
            setShowMenu(false);
        }
    };

    return (
        <div
            className={`sidebar-item-wrapper ${active ? 'active' : ''} ${isUnread ? 'unread' : ''}`}
            onClick={() => setActiveChannel(channel)}
        >
            <div className="sidebar-item">
                <div className="sidebar-item-left">
                    {isGroup ? (
                        <div className="sidebar-avatar-group">
                            <Users size={16} />
                        </div>
                    ) : (
                        <div className="sidebar-avatar-wrapper">
                            <div className="sidebar-avatar">
                                {initials}
                            </div>
                            {isOnline && <span className="status-dot-small online"></span>}
                        </div>
                    )}
                    <div className="sidebar-item-content">
                        <div className="sidebar-item-header">
                            <span className={`sidebar-item-name ${isUnread ? 'bold' : ''}`}>{title}</span>
                            {timeDisplay && <span className="sidebar-item-time">{timeDisplay}</span>}
                        </div>
                        {messagePreview && (
                            <div className={`sidebar-item-message ${isUnread ? 'bold' : ''}`}>
                                {messagePreview}
                            </div>
                        )}
                    </div>
                </div>
                <div className="sidebar-item-right">
                    {unreadCount > 0 && (
                        <span className="unread-badge">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                    <div className="sidebar-item-menu" ref={menuRef}>
                        <button
                            className="sidebar-item-menu-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            title="More options"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                            </svg>
                        </button>
                        {showMenu && (
                            <div className="sidebar-item-menu-dropdown">
                                <button
                                    onClick={handleDelete}
                                    className="danger"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                    </svg>
                                    Delete {isGroup ? 'Group' : 'Chat'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const CustomChannelList = ({ loading, error, channels, setActiveChannel, activeChannel, chatClient, onDeleteChannel, refreshKey, searchQuery = '' }) => {
    const [localChannels, setLocalChannels] = useState([]);
    const [isLoadingChannels, setIsLoadingChannels] = useState(true);

    
    useEffect(() => {
        if (!chatClient || !chatClient.userID) return;

        const loadChannels = async () => {
            try {
                setIsLoadingChannels(true);
                const queryChannels = await chatClient.queryChannels(
                    { type: 'messaging', members: { $in: [chatClient.userID] } },
                    { last_message_at: -1 },
                    { presence: true, state: true, watch: true }
                );
                console.log('Loaded channels:', queryChannels.length, queryChannels.map(c => ({
                    id: c.id,
                    cid: c.cid,
                    name: c.data?.name,
                    members: Object.keys(c.state?.members || {}).length,
                    lastMessage: c.state?.last_message_at
                })));
                setLocalChannels(queryChannels);
            } catch (err) {
                console.error('Error loading channels:', err);
            } finally {
                setIsLoadingChannels(false);
            }
        };

        loadChannels();

        
        const handleChannelCreated = () => {
            console.log('Channel created event - refreshing list');
            setTimeout(() => loadChannels(), 500);
        };

        const handleChannelUpdated = () => {
            console.log('Channel updated event - refreshing list');
            setTimeout(() => loadChannels(), 300);
        };

        const handleMessageNew = () => {
            console.log('New message event - refreshing list');
            setTimeout(() => loadChannels(), 300);
        };

        chatClient.on('channel.created', handleChannelCreated);
        chatClient.on('channel.updated', handleChannelUpdated);
        chatClient.on('message.new', handleMessageNew);

        return () => {
            chatClient.off('channel.created', handleChannelCreated);
            chatClient.off('channel.updated', handleChannelUpdated);
            chatClient.off('message.new', handleMessageNew);
        };
    }, [chatClient, chatClient?.userID, refreshKey]);

    
    const displayChannels = channels && channels.length > 0 ? channels : localChannels;
    const isLoading = loading || isLoadingChannels;

    if (error) {
        return <div className="sidebar-error">Error loading conversations</div>;
    }
    if (isLoading) {
        return <div className="sidebar-loading">Loading conversations...</div>;
    }
    if (!displayChannels || displayChannels.length === 0) {
        return (
            <div className="sidebar-empty">
                <p>No conversations yet.</p>
                <p className="sidebar-empty-hint">Start a new chat to begin messaging!</p>
            </div>
        );
    }

    
    const filterChannels = (channels) => {
        if (!searchQuery || !searchQuery.trim()) {
            return channels;
        }

        const query = searchQuery.toLowerCase().trim();

        return channels.filter(channel => {
            
            if (channel.data?.group === true || (channel.state?.members && Object.keys(channel.state.members).length > 2)) {
                const groupName = channel.data?.name || 'Group Chat';
                return groupName.toLowerCase().includes(query);
            }

            
            const members = Object.values(channel.state?.members || {});
            const otherMember = members.find(m => m.user?.id !== chatClient?.userID);
            const userName = otherMember?.user?.name || '';
            const userEmail = otherMember?.user?.email || '';

            
            if (userName.toLowerCase().includes(query) || userEmail.toLowerCase().includes(query)) {
                return true;
            }

            
            const lastMessage = channel.state?.messages?.[channel.state.messages.length - 1];
            if (lastMessage?.text && lastMessage.text.toLowerCase().includes(query)) {
                return true;
            }

            return false;
        });
    };

    
    const groupChannels = displayChannels.filter(ch => ch.data?.group === true || (ch.state?.members && Object.keys(ch.state.members).length > 2));
    const directChannels = displayChannels.filter(ch => !groupChannels.includes(ch));

    
    const filteredGroupChannels = filterChannels(groupChannels);
    const filteredDirectChannels = filterChannels(directChannels);

    
    const sortChannels = (channels) => {
        return [...channels].sort((a, b) => {
            const aTime = a.state?.last_message_at || a.created_at || 0;
            const bTime = b.state?.last_message_at || b.created_at || 0;
            const aDate = aTime ? new Date(aTime).getTime() : 0;
            const bDate = bTime ? new Date(bTime).getTime() : 0;
            return bDate - aDate;
        });
    };

    const sortedGroups = sortChannels(filteredGroupChannels);
    const sortedDirect = sortChannels(filteredDirectChannels);

    
    if (searchQuery.trim() && sortedGroups.length === 0 && sortedDirect.length === 0) {
        return (
            <div className="sidebar-empty">
                <p>No conversations found for "{searchQuery}"</p>
                <p className="sidebar-empty-hint">Try a different search term</p>
            </div>
        );
    }

    return (
        <div className="sidebar-channels-list">
            {}
            {sortedDirect.length > 0 && (
                <div className="sidebar-section">
                    {!searchQuery.trim() && (
                        <div className="sidebar-section-header">
                            <h3 className="sidebar-section-title">Direct Messages</h3>
                        </div>
                    )}
                    <div className="sidebar-section-content">
                        {sortedDirect.map((channel) => (
                            <ChannelPreview
                                key={channel.id || channel.cid}
                                channel={channel}
                                active={activeChannel?.id === channel.id || activeChannel?.cid === channel.cid}
                                setActiveChannel={setActiveChannel}
                                chatClient={chatClient}
                                isGroup={false}
                                onDelete={onDeleteChannel}
                            />
                        ))}
                    </div>
                </div>
            )}

            {}
            {sortedGroups.length > 0 && (
                <div className="sidebar-section">
                    {!searchQuery.trim() && (
                        <div className="sidebar-section-header">
                            <h3 className="sidebar-section-title">Groups</h3>
                        </div>
                    )}
                    <div className="sidebar-section-content">
                        {sortedGroups.map((channel) => (
                            <ChannelPreview
                                key={channel.id || channel.cid}
                                channel={channel}
                                active={activeChannel?.id === channel.id || activeChannel?.cid === channel.cid}
                                setActiveChannel={setActiveChannel}
                                chatClient={chatClient}
                                isGroup={true}
                                onDelete={onDeleteChannel}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const ChatSidebar = ({ activeChannel, setActiveChannel, onAddUser, onAddGroup, channelListKey, filters, sort, options, onDeleteChannel }) => {
    const [refreshKey, setRefreshKey] = useState(0);

    
    useEffect(() => {
        setRefreshKey(prev => prev + 1);
    }, [channelListKey]);
    const { chatClient } = useStream();
    const { authUser, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef(null);

    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const userInitials = authUser?.name
        ? authUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : 'U';

    return (
        <div className="chat-sidebar">
            {}
            <div className="sidebar-header">
                <div className="sidebar-header-content">
                    <div className="sidebar-logo">
                        <span>T</span>
                    </div>
                    <div className="sidebar-header-info">
                        <h1 className="sidebar-title">TeamSync</h1>
                        <p className="sidebar-subtitle">Chat & Connect</p>
                    </div>
                </div>
            </div>

            {}
            <div className="sidebar-search">
                <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="sidebar-search-input"
                />
            </div>

            {}
            <div className="sidebar-actions">
                <button
                    className="sidebar-action-btn"
                    onClick={onAddUser}
                    title="New Chat"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                        <path d="M12 11v6m0 0v-6m0 6h6m-6 0H6" />
                    </svg>
                    <span>New Chat</span>
                </button>
                <button
                    className="sidebar-action-btn"
                    onClick={onAddGroup}
                    title="Create Group"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    <span>Create Group</span>
                </button>
            </div>

            {}
            <div className="sidebar-channels">
                <CustomChannelList
                    loading={false}
                    error={null}
                    channels={[]}
                    activeChannel={activeChannel}
                    setActiveChannel={setActiveChannel}
                    chatClient={chatClient}
                    onDeleteChannel={onDeleteChannel}
                    refreshKey={channelListKey}
                    searchQuery={searchQuery}
                />
            </div>

            {}
            {}
            <div className="sidebar-profile" ref={profileMenuRef}>
                <div className="sidebar-profile-btn">
                    <div className="sidebar-profile-avatar">
                        {userInitials}
                    </div>
                    <div className="sidebar-profile-info">
                        <div className="sidebar-profile-name">{authUser?.name || 'User'}</div>
                        <div className="sidebar-profile-status online">
                            <span className="status-dot-small"></span>
                            <span>Online</span>
                        </div>
                    </div>
                    <button
                        className="sidebar-profile-settings"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowProfileMenu(!showProfileMenu);
                        }}
                        title="More options"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                        </svg>
                    </button>
                </div>

                {showProfileMenu && (
                    <div className="sidebar-profile-menu">
                        <button onClick={() => { navigate('/onboarding'); setShowProfileMenu(false); }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            Settings
                        </button>
                        <div className="sidebar-profile-menu-divider"></div>
                        <button className="danger" onClick={handleLogout}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Log Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;

