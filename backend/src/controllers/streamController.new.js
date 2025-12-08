import { ENV } from "../config/env.js";
import { StreamChat } from 'stream-chat';

export const getChatToken = async (req, res) => {
    try {
        const userId = req.user._id.toString();

        // Validate that we have the required credentials
        if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Stream API credentials not configured"
            });
        }

        // Create Stream chat client
        const serverClient = StreamChat.getInstance(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);

        // Create token for Stream chat
        const token = serverClient.createToken(userId);

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
            message: "Failed to generate chat token",
            error: error.message
        });
    }
};

export const getVideoToken = async (req, res) => {
    try {
        const userId = req.user._id.toString();

        // Validate that we have the required credentials
        if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Stream API credentials not configured"
            });
        }

        // Create Stream chat client
        const serverClient = StreamChat.getInstance(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);

        // Create token for Stream video
        const token = serverClient.createToken(userId);

        res.status(200).json({
            success: true,
            token,
            userId,
            apiKey: ENV.STREAM_API_KEY
        });

    } catch (error) {
        console.error("Error generating Video Token:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to generate video token",
            error: error.message
        });
    }
};

export const createDirectMessageChannel = async (req, res) => {
    try {
        // Validate that we have the required credentials
        if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
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

        // Create channel ID
        const channelId = [currentUserId, targetUserId].sort().join('-');

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
        // Validate that we have the required credentials
        if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
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
        // Validate that we have the required credentials
        if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
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

        // Create Stream chat client
        const serverClient = StreamChat.getInstance(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);

        // Create tokens for both users
        const currentUserToken = serverClient.createToken(currentUserId);
        const targetUserToken = serverClient.createToken(targetUserId);

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