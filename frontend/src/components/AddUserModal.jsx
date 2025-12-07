import { useState } from 'react';
import { createDirectMessageChannel, createVideoCall, searchUser } from '../services/api';
import { useStream } from '../contexts/StreamContext';
import toast from 'react-hot-toast';
import '../styles/add-user-modal.css';

const AddUserModal = ({ onClose, onChannelCreated }) => {
    const [searchInput, setSearchInput] = useState('');
    const [searchType, setSearchType] = useState('email'); 
    const [foundUser, setFoundUser] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreatingChannel, setIsCreatingChannel] = useState(false);
    const { chatClient } = useStream();

    const handleSearch = async () => {
        if (!searchInput.trim()) {
            toast.error('Please enter a userId or email');
            return;
        }

        setIsSearching(true);
        setFoundUser(null);

        try {
            const userId = searchType === 'userId' ? searchInput.trim() : null;
            const email = searchType === 'email' ? searchInput.trim() : null;
            
            console.log('Searching user:', { userId, email, searchType });
            const user = await searchUser(userId, email);
            console.log('User found:', user);
            setFoundUser(user);
            toast.success('User found!');
        } catch (error) {
            console.error('Search error:', error);
            const errorMessage = error.message || 'User not found. Please check the email address and try again.';
            toast.error(errorMessage);
            setFoundUser(null);
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreateChannel = async () => {
        if (!foundUser) return;

        setIsCreatingChannel(true);
        try {
            const result = await createDirectMessageChannel(foundUser._id);
            
            
            if (chatClient) {
                const channelId = result.channelId;
                // Instead of just watching, let's query for the channel to ensure it exists
                const channels = await chatClient.queryChannels({
                    id: channelId,
                    type: 'messaging'
                });
                
                let channel;
                if (channels.length > 0) {
                    channel = channels[0];
                } else {
                    // If channel doesn't exist in the query, create it
                    channel = chatClient.channel('messaging', channelId);
                    await channel.watch();
                }
                
                if (onChannelCreated) {
                    onChannelCreated(channel);
                }
            }

            toast.success('Chat started successfully!');
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to create channel');
        } finally {
            setIsCreatingChannel(false);
        }
    };

    const handleStartVideoCall = async () => {
        if (!foundUser) return;

        try {
            const result = await createVideoCall(foundUser._id);
            toast.success('Video call created!');
            onClose();
            
            // Dispatch event with proper call type
            window.dispatchEvent(new CustomEvent('startVideoCall', { 
                detail: { 
                    callId: result.callId,
                    callType: 'default'  // Specify the call type
                } 
            }));
        } catch (error) {
            toast.error(error.message || 'Failed to create video call');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="add-user-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-content">
                        <div className="modal-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                <circle cx="8.5" cy="7" r="4" />
                                <path d="M20 8v6M23 11h-6" />
                            </svg>
                        </div>
                        <div>
                            <h2>Start New Conversation</h2>
                            <p className="modal-subtitle">Search for a user to chat or video call</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="close-button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    {}
                    <div className="form-group">
                        <label className="form-label">Search by</label>
                        <div className="search-type-toggle">
                            <button
                                type="button"
                                className={`toggle-option ${searchType === 'userId' ? 'active' : ''}`}
                                onClick={() => {
                                    setSearchType('userId');
                                    setFoundUser(null);
                                    setSearchInput('');
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <span>User ID</span>
                            </button>
                            <button
                                type="button"
                                className={`toggle-option ${searchType === 'email' ? 'active' : ''}`}
                                onClick={() => {
                                    setSearchType('email');
                                    setFoundUser(null);
                                    setSearchInput('');
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                                <span>Email</span>
                            </button>
                        </div>
                    </div>

                    {}
                    <div className="form-group">
                        <label htmlFor="searchInput" className="form-label">
                            {searchType === 'userId' ? 'User ID (MongoDB ObjectId)' : 'Email Address'}
                        </label>
                        {searchType === 'userId' && (
                            <div className="info-banner">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4M12 8h.01" />
                                </svg>
                                <span>User ID is a 24-character MongoDB ObjectId (e.g., 507f1f77bcf86cd799439011). <strong>Tip: Use Email instead - it's easier!</strong></span>
                            </div>
                        )}
                        <div className="search-input-wrapper">
                            <div className="search-icon">
                                {searchType === 'userId' ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                )}
                            </div>
                            <input
                                id="searchInput"
                                type={searchType === 'email' ? 'email' : 'text'}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={searchType === 'userId' ? 'Enter 24-character MongoDB ObjectId' : 'Enter email address (e.g., user@example.com)'}
                                className="search-input"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !isSearching && searchInput.trim()) {
                                        handleSearch();
                                    }
                                }}
                                autoFocus
                            />
                            <button
                                onClick={handleSearch}
                                disabled={isSearching || !searchInput.trim()}
                                className="search-button"
                            >
                                {isSearching ? (
                                    <>
                                        <svg className="spinner" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeDashoffset="32">
                                                <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite" />
                                                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite" />
                                            </circle>
                                        </svg>
                                        <span>Searching...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="M21 21l-4.35-4.35" />
                                        </svg>
                                        <span>Search</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Found User Display */}
                    {foundUser && (
                        <div className="found-user-card">
                            <div className="user-card-header">
                                <div className="user-avatar-large">
                                    {foundUser.profilePic ? (
                                        <img src={foundUser.profilePic} alt={foundUser.name} />
                                    ) : (
                                        <span>{foundUser.name?.charAt(0).toUpperCase() || 'U'}</span>
                                    )}
                                </div>
                                <div className="user-info">
                                    <h3 className="user-name">{foundUser.name || 'User'}</h3>
                                    <p className="user-email">{foundUser.email}</p>
                                    {foundUser.bio && (
                                        <p className="user-bio">{foundUser.bio}</p>
                                    )}
                                </div>
                            </div>

                            <div className="user-actions">
                                <button
                                    onClick={handleCreateChannel}
                                    disabled={isCreatingChannel}
                                    className="action-btn action-btn-primary"
                                >
                                    {isCreatingChannel ? (
                                        <>
                                            <svg className="spinner-small" viewBox="0 0 24 24" fill="none">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeDashoffset="32">
                                                    <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite" />
                                                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite" />
                                                </circle>
                                            </svg>
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                            </svg>
                                            <span>Start Chat</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleStartVideoCall}
                                    className="action-btn action-btn-secondary"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 7l-7 5 7 5V7z" />
                                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                    </svg>
                                    <span>Video Call</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!foundUser && !isSearching && (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <p className="empty-state-text">
                                Enter a {searchType === 'userId' ? 'user ID' : 'email address'} to search for a user
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddUserModal;
