import { useState, useEffect } from 'react';
import { searchUser, getAllUsers, createGroupChannel } from '../services/api';
import { useStream } from '../contexts/StreamContext';
import toast from 'react-hot-toast';
import '../styles/add-user-modal.css';

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
    const [groupName, setGroupName] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchType, setSearchType] = useState('email');
    const [foundUser, setFoundUser] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [showUserList, setShowUserList] = useState(false);
    const { chatClient } = useStream();

    
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const users = await getAllUsers();
                setAllUsers(users);
            } catch (error) {
                console.error('Failed to load users:', error);
            }
        };
        loadUsers();
    }, []);

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
            
            const user = await searchUser(userId, email);
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

    const handleAddUser = () => {
        if (!foundUser) return;
        
        
        if (selectedUsers.find(u => u._id === foundUser._id)) {
            toast.error('User already added to group');
            return;
        }

        setSelectedUsers([...selectedUsers, foundUser]);
        setFoundUser(null);
        setSearchInput('');
        toast.success('User added to group');
    };

    const handleRemoveUser = (userId) => {
        setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            toast.error('Please enter a group name');
            return;
        }

        if (selectedUsers.length < 2) {
            toast.error('Please add at least 2 users to create a group');
            return;
        }

        setIsCreatingGroup(true);
        try {
            const userIds = selectedUsers.map(u => u._id);
            const result = await createGroupChannel(groupName.trim(), userIds);
            
            if (chatClient) {
                const channelId = result.channelId;
                const channel = chatClient.channel('messaging', channelId);
                await channel.watch();
                
                if (onGroupCreated) {
                    onGroupCreated(channel);
                }
            }

            toast.success('Group created successfully!');
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to create group');
        } finally {
            setIsCreatingGroup(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="add-user-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-content">
                        <div className="modal-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                            </svg>
                        </div>
                        <div>
                            <h2>Create Group</h2>
                            <p className="modal-subtitle">Add multiple users to create a group chat</p>
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
                        <label htmlFor="groupName" className="form-label">Group Name</label>
                        <input
                            id="groupName"
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name (e.g., Team Project)"
                            className="search-input"
                            autoFocus
                        />
                    </div>

                    {}
                    {selectedUsers.length > 0 && (
                        <div className="form-group">
                            <label className="form-label">Selected Users ({selectedUsers.length})</label>
                            <div className="selected-users-list">
                                {selectedUsers.map((user) => (
                                    <div key={user._id} className="selected-user-chip">
                                        <div className="selected-user-avatar">
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <span className="selected-user-name">{user.name || user.email}</span>
                                        <button
                                            className="remove-user-btn"
                                            onClick={() => handleRemoveUser(user._id)}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {}
                    <div className="form-group">
                        <label className="form-label">Add User by</label>
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
                                placeholder={searchType === 'userId' ? 'Enter 24-character MongoDB ObjectId' : 'Enter email address'}
                                className="search-input"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !isSearching && searchInput.trim()) {
                                        handleSearch();
                                    }
                                }}
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

                    {}
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
                                </div>
                            </div>

                            <div className="user-actions">
                                <button
                                    onClick={handleAddUser}
                                    className="action-btn action-btn-primary"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span>Add to Group</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {}
                    <div className="modal-footer">
                        <button
                            onClick={handleCreateGroup}
                            disabled={isCreatingGroup || !groupName.trim() || selectedUsers.length < 2}
                            className="action-btn action-btn-primary"
                            style={{ width: '100%' }}
                        >
                            {isCreatingGroup ? (
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
                                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                                    </svg>
                                    <span>Create Group ({selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'})</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;

