import { getChatServer, getVideoServer, isInitialized } from "../config/streamConfig.js";
import { ENV } from "../config/env.js";
import jwt from 'jsonwebtoken';

export const getChatToken = async (req, res) => {
    try {
        if (!isInitialized) {
            return res.status(501).json({
                success: false,
                message: "Stream services not configured"
            });
        }

        const chatClient = getChatServer();
        if (!chatClient) {
            throw new Error('Stream chat client not initialized');
        }

        const userId = req.user._id.toString();

        const token = chatClient.createToken(userId);

        await chatClient.upsertUser({
            id: userId,
            name: req.user.name,
            image: req.user.image || '',
            role: 'user'
        });

        res.status(200).json({
            success: true,
            token,
            userId,
            apiKey: ENV.STREAM_API_KEY
        });

    } catch (error) {
        console.error("Error generating Chat Token:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to generate chat token"
        });
    }
};

export const getVideoToken = async (req, res) => {
    try {
        if (!isInitialized) {
            return res.status(501).json({
                success: false,
                message: "Stream services not configured"
            });
        }

        const videoClient = getVideoServer();
        if (!videoClient) {
            throw new Error('Stream video client not initialized');
        }

        const userId = req.user._id.toString();

        
        
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

        res.status(200).json({
            success: true,
            token,
            userId,
            apiKey: ENV.STREAM_API_KEY
        });
    } catch (error) {
        console.error("Error generating Video Token:", error.message);

        
        try {
            const fs = await import('fs');
            const path = await import('path');
            const logPath = path.resolve(process.cwd(), 'error.log');
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] Video Token Error: ${error.message}\nStack: ${error.stack}\n\n`;
            fs.appendFileSync(logPath, logMessage);
        } catch (logErr) {
            console.error("Failed to write log:", logErr);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to generate video token'
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