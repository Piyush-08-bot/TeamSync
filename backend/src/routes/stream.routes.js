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


router.post('/chat/channel', protectRoute, createDirectMessageChannel);
router.post('/chat/group', protectRoute, createGroupChannel);
router.post('/video/call', protectRoute, createVideoCall);

export default router;