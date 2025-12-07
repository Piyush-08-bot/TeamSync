import { getChatServer, getVideoServer, isInitialized } from "../config/streamConfig.js";
import { ENV } from "../config/env.js";
import jwt from 'jsonwebtoken';

export const getChatToken = async (req, res) => {
    try {
        console.log('=== getChatToken called ===');
        console.log('User:', req.user?._id);
        console.log('isInitialized:', isInitialized);
        console.log('ENV.STREAM_API_KEY:', ENV.STREAM_API_KEY ? 'SET' : 'MISSING');
        console.log('ENV.STREAM_API_SECRET:', ENV.STREAM_API_SECRET ? 'SET' : 'MISSING');
        
        if (!isInitialized) {
            console.log('❌ Stream services not initialized');
            return res.status(501).json({
                success: false,
                message: "Stream services not configured",
                details: "Stream clients failed to initialize. Check environment variables."
            });
        }

        const chatClient = getChatServer();
        console.log('Chat client:', !!chatClient);
        
        if (!chatClient) {
            console.log('❌ Stream chat client not initialized');
            throw new Error('Stream chat client not initialized');
        }

        const userId = req.user._id.toString();
        console.log('Generating token for user:', userId);

        // Validate that we have the required credentials
        if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
            throw new Error('Missing Stream API credentials');
        }

        const token = chatClient.createToken(userId);
        console.log('Token generated successfully');

        await chatClient.upsertUser({
            id: userId,
            name: req.user.name,
            image: req.user.image || '',
            role: 'user'
        });
        console.log('User upserted successfully');

        res.status(200).json({
            success: true,
            token,
            userId,
            apiKey: ENV.STREAM_API_KEY
        });

    } catch (error) {
        console.error("Error generating Chat Token:", error.message);
        console.error("Error stack:", error.stack);
        res.status(500).json({
            success: false,
            message: "Failed to generate chat token",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const getVideoToken = async (req, res) => {
    try {
        console.log('=== getVideoToken called ===');
        console.log('User:', req.user?._id);
        console.log('isInitialized:', isInitialized);
        console.log('ENV.STREAM_API_KEY:', ENV.STREAM_API_KEY ? 'SET' : 'MISSING');
        console.log('ENV.STREAM_API_SECRET:', ENV.STREAM_API_SECRET ? 'SET' : 'MISSING');
        
        if (!isInitialized) {
            console.log('❌ Stream services not initialized');
            return res.status(501).json({
                success: false,
                message: "Stream services not configured",
                details: "Stream clients failed to initialize. Check environment variables."
            });
        }

        const videoClient = getVideoServer();
        console.log('Video client:', !!videoClient);
        
        if (!videoClient) {
            console.log('❌ Stream video client not initialized');
            throw new Error('Stream video client not initialized');
        }

        const userId = req.user._id.toString();
        console.log('Generating video token for user:', userId);

        // Validate that we have the required credentials
        if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
            throw new Error('Missing Stream API credentials');
        }

        // Generate JWT token for video client
        const token = jwt.sign(
            {
                user_id: userId,
            },
            ENV.STREAM_API_SECRET,
            {
                algorithm: 'HS256',
                noTimestamp: false,
            }
        );
        console.log('Video token generated successfully');

        res.status(200).json({
            success: true,
            token,
            userId,
            apiKey: ENV.STREAM_API_KEY
        });
    } catch (error) {
        console.error("Error generating Video Token:", error.message);
        console.error("Error stack:", error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Failed to generate video token',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};


export const createDirectMessageChannel = async (req, res) => {
    try {
        const chatClient = getChatServer();
        if (!isInitialized || !chatClient) {
            return res.status(501).json({
                success: false,
                message: "Stream services not configured"
            });
        }

        const { targetUserId } = req.body;
        const currentUserId = req.user._id.toString();

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: "Target user ID is required"
            });
        }

        if (targetUserId === currentUserId) {
            return res.status(400).json({
                success: false,
                message: "Cannot create a channel with yourself"
            });
        }

        
        const channelId = [currentUserId, targetUserId].sort().join('-');

        
        let channel = chatClient.channel('messaging', channelId);

        try {
            const state = await channel.query({ state: true });
            if (state.channel) {
                return res.status(200).json({
                    success: true,
                    channelId: channelId,
                    message: "Channel already exists"
                });
            }
        } catch (error) {
            
        }

        
        channel = chatClient.channel('messaging', channelId, {
            members: [currentUserId, targetUserId],
            created_by_id: currentUserId
        });

        
        await channel.watch();

        
        const state = await channel.query({ messages: { limit: 1 } });
        if (state.messages.length === 0) {
            await channel.sendMessage({
                text: 'Chat started',
                type: 'system',
                user: { id: currentUserId }
            });
        }

        res.status(200).json({
            success: true,
            channelId: channelId,
            message: "Direct message channel created successfully"
        });

    } catch (error) {
        console.error("Error creating direct message channel:", error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create direct message channel',
            error: error.message
        });
    }
};


export const createGroupChannel = async (req, res) => {
    try {
        const chatClient = getChatServer();
        if (!isInitialized || !chatClient) {
            return res.status(501).json({
                success: false,
                message: "Stream services not configured"
            });
        }

        const { groupName, userIds } = req.body;
        const currentUserId = req.user._id.toString();

        if (!groupName || !groupName.trim()) {
            return res.status(400).json({
                success: false,
                message: "Group name is required"
            });
        }

        if (!userIds || !Array.isArray(userIds) || userIds.length < 2) {
            return res.status(400).json({
                success: false,
                message: "At least 2 users are required to create a group"
            });
        }

        
        const allMemberIds = [currentUserId, ...userIds];
        const uniqueMemberIds = [...new Set(allMemberIds.map(id => id.toString()))];

        
        const channelId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        
        const channel = chatClient.channel('messaging', channelId, {
            name: groupName.trim(),
            members: uniqueMemberIds,
            created_by_id: currentUserId,
            group: true
        });

        
        await channel.watch();

        res.status(201).json({
            success: true,
            channelId: channelId,
            message: "Group channel created successfully"
        });
    } catch (error) {
        console.error('Error creating group channel:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create group channel',
            error: error.message
        });
    }
};


export const createVideoCall = async (req, res) => {
    try {
        const videoClient = getVideoServer();

        if (!isInitialized || !videoClient) {
            return res.status(501).json({
                success: false,
                message: "Stream services not configured"
            });
        }

        const { targetUserId } = req.body;
        const currentUserId = req.user._id.toString();

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: "Target user ID is required"
            });
        }

        if (targetUserId === currentUserId) {
            return res.status(400).json({
                success: false,
                message: "Cannot create a video call with yourself"
            });
        }

        
        const callId = `direct-${[currentUserId, targetUserId].sort().join('-')}`;

        

        
        const currentUserToken = jwt.sign(
            { user_id: currentUserId },
            ENV.STREAM_API_SECRET,
            { algorithm: 'HS256', noTimestamp: false }
        );
        const targetUserToken = jwt.sign(
            { user_id: targetUserId },
            ENV.STREAM_API_SECRET,
            { algorithm: 'HS256', noTimestamp: false }
        );

        res.status(200).json({
            success: true,
            callId: callId,
            currentUser: {
                userId: currentUserId,
                token: currentUserToken
            },
            targetUser: {
                userId: targetUserId,
                token: targetUserToken
            },
            apiKey: ENV.STREAM_API_KEY,
            message: "Video call room created successfully"
        });

    } catch (error) {
        console.error("Error creating video call:", error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create video call',
            error: error.message
        });
    }
};