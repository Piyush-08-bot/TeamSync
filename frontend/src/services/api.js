import { API_BASE_URL } from '../utils/constants';


const getAuthToken = () => localStorage.getItem('token');


export const getStreamChatToken = async () => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/stream/chat/token`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch chat token');
    }

    return response.json();
};


export const getStreamVideoToken = async () => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/stream/video/token`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch video token');
    }

    return response.json();
};


export const createDirectMessageChannel = async (targetUserId) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}/stream/chat/channel`;
    console.log('🔵 Creating channel - URL:', url);
    console.log('🔵 Target User ID:', targetUserId);
    console.log('🔵 Has token:', !!token);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUserId })
    });

    console.log('🔵 Response status:', response.status);
    console.log('🔵 Response OK:', response.ok);

    const contentType = response.headers.get('content-type');
    if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create direct message channel');
        } else {
            throw new Error(`Failed to create channel: ${response.status} ${response.statusText}`);
        }
    }

    return response.json();
};


export const createVideoCall = async (targetUserId) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/stream/video/call`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUserId })
    });

    const contentType = response.headers.get('content-type');
    if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create video call');
        } else {
            throw new Error(`Failed to create video call: ${response.status} ${response.statusText}`);
        }
    }

    return response.json();
};


export const getAllUsers = async () => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found. Please login again.');
    }

    const response = await fetch(`${API_BASE_URL}/chat/users`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    const contentType = response.headers.get('content-type');
    if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to get users');
        } else {
            throw new Error(`Failed to get users: ${response.status} ${response.statusText}`);
        }
    }

    return response.json();
};


export const createGroupChannel = async (groupName, userIds) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/stream/chat/group`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ groupName, userIds })
    });

    const contentType = response.headers.get('content-type');
    if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create group channel');
        } else {
            throw new Error(`Failed to create group: ${response.status} ${response.statusText}`);
        }
    }

    return response.json();
};


export const searchUser = async (userId, email) => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found. Please login again.');
    }

    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (email) params.append('email', email);

    const url = `${API_BASE_URL}/chat/user/search?${params}`;
    console.log('Searching user at URL:', url);
    console.log('Search params:', { userId, email });

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));


    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 500));

        if (response.status === 404) {
            throw new Error(`User search endpoint not found. Please check if the backend server is running and the route is registered.`);
        }

        throw new Error(`Server error: ${response.status} ${response.statusText}. Response: ${text.substring(0, 100)}`);
    }

    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
        throw new Error(data.message || `Failed to search user: ${response.status}`);
    }

    return data;
};