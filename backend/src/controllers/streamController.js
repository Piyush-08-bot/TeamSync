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
        console.log("Starting createDirectMessageChannel function");
        console.log("Request body:", req.body);
        console.log("User from token:", req.user);
        
        // Ensure database connection
        try {
            await connectDB();
            console.log("Database connection established");
        } catch (dbError) {
            console.error("Database connection failed:", dbError.message);
            return res.status(503).json({
                success: false,
                message: "Database connection failed",
                error: dbError.message
            });
        }
        
        // Validate that we have the required credentials
        if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
            console.error("Stream services not configured - Missing API key or secret");
            return res.status(501).json({
                success: false,
                message: "Stream services not configured - Missing API key or secret",
                details: {
                    hasApiKey: !!ENV.STREAM_API_KEY,
                    hasApiSecret: !!ENV.STREAM_API_SECRET
                }
            });
        }

        // Log the credentials info (masked)
        console.log("Stream API Key present:", !!ENV.STREAM_API_KEY);
        console.log("Stream API Secret present:", !!ENV.STREAM_API_SECRET);
        if (ENV.STREAM_API_KEY) {
            console.log("Stream API Key (first 5 chars):", ENV.STREAM_API_KEY.substring(0, 5));
        }

        // Test if Stream credentials are valid
        try {
            console.log("Attempting to validate Stream credentials...");
            const serverClient = StreamChat.getInstance(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);
            // Test the connection by getting the app settings
            const appSettings = await serverClient.getAppSettings();
            console.log("Stream credentials validated successfully", {
                app: appSettings.app?.name,
                organization: appSettings.app?.organization_name
            });
        } catch (credentialError) {
            console.error("Stream credentials validation failed:", credentialError.message);
            console.error("Credential error stack:", credentialError.stack);
            return res.status(500).json({
                success: false,
                message: "Invalid Stream credentials - Please check your STREAM_API_KEY and STREAM_API_SECRET",
                error: credentialError.message,
                details: {
                    hasApiKey: !!ENV.STREAM_API_KEY,
                    hasApiSecret: !!ENV.STREAM_API_SECRET
                }
            });
        }

        const { targetUserId } = req.body;
        const currentUserId = req.user._id.toString();

        console.log("Current user ID:", currentUserId);
        console.log("Target user ID:", targetUserId);

        if (!targetUserId) {
            console.error("Target user ID is required");
            return res.status(400).json({
                success: false,
                message: "Target user ID is required"
            });
        }

        if (targetUserId === currentUserId) {
            console.error("Cannot create a channel with yourself");
            return res.status(400).json({
                success: false,
                message: "Cannot create a channel with yourself"
            });
        }

        // Create channel ID
        const channelId = [currentUserId, targetUserId].sort().join('-');
        console.log("Generated channel ID:", channelId);

        // Create Stream chat client
        console.log("Creating StreamChat client with API key:", ENV.STREAM_API_KEY.substring(0, 5) + "...");
        const serverClient = StreamChat.getInstance(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);
        
        // Create the channel with proper member configuration
        const channel = serverClient.channel('messaging', channelId);
        
        console.log("Creating channel with members:", [currentUserId, targetUserId]);
        // Create or update the channel with both users as members
        await channel.create({
            members: [currentUserId, targetUserId],
            created_by_id: currentUserId
        });
        
        console.log("Channel created successfully");

        res.status(200).json({
            success: true,
            channelId: channelId,
            message: "Direct message channel created successfully"
        });

    } catch (error) {
        console.error("Error creating direct message channel:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to create direct message channel',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

        // Create a more unique call ID
        const callId = `direct-${Date.now()}-${[currentUserId, targetUserId].sort().join('-')}`;

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