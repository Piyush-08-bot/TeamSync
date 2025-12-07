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

// Add a completely new test endpoint that doesn't use any Stream code
router.get('/test-new', protectRoute, (req, res) => {
    res.status(200).json({
        success: true,
        message: "New test endpoint working",
        user: req.user._id,
        timestamp: new Date().toISOString()
    });
});

// Add a simple echo endpoint to test if the route is working
router.get('/echo', (req, res) => {
    res.status(200).json({
        message: "Echo endpoint working",
        path: req.path,
        method: req.method,
        query: req.query,
        headers: Object.keys(req.headers)
    });
});


router.post('/chat/channel', protectRoute, createDirectMessageChannel);
router.post('/chat/group', protectRoute, createGroupChannel);
router.post('/video/call', protectRoute, createVideoCall);

export default router;