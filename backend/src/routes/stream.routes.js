import express from 'express';
import {
    getChatToken,
    getVideoToken,
    createDirectMessageChannel,
    createGroupChannel,
    createVideoCall
} from '../controllers/streamController.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();


router.get('/chat/token', protectRoute, getChatToken);
router.get('/video/token', protectRoute, getVideoToken);

// Add a simple test route to verify the route is working
router.get('/test-simple', protectRoute, (req, res) => {
    console.log('Simple test route called');
    res.status(200).json({
        success: true,
        message: 'Test route working',
        user: req.user._id
    });
});

// Add a test endpoint to verify Stream credentials
router.get('/test-credentials', async (req, res) => {
    try {
        const { ENV } = await import('../config/env.js');
        const { StreamChat } = await import('stream-chat');
        
        console.log('Testing Stream credentials...');
        console.log('STREAM_API_KEY:', ENV.STREAM_API_KEY ? 'SET' : 'MISSING');
        console.log('STREAM_API_SECRET:', ENV.STREAM_API_SECRET ? 'SET' : 'MISSING');
        
        if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
            return res.status(400).json({
                success: false,
                message: 'Stream credentials not configured'
            });
        }
        
        // Test creating a client
        const client = StreamChat.getInstance(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);
        console.log('Client created with key:', client.key);
        
        // Test getting app settings
        const appSettings = await client.getAppSettings();
        console.log('App settings retrieved successfully');
        
        res.status(200).json({
            success: true,
            message: 'Stream credentials are valid',
            apiKey: ENV.STREAM_API_KEY.substring(0, 5) + '...' // Mask the key for security
        });
    } catch (error) {
        console.error('Stream credential test failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Stream credential test failed',
            error: error.message
        });
    }
});


router.post('/chat/channel', protectRoute, createDirectMessageChannel);
router.post('/chat/group', protectRoute, createGroupChannel);
router.post('/video/call', protectRoute, createVideoCall);

export default router;