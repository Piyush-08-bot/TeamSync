import express from 'express';
import { handleStreamWebhook, handlePresendMessageHook } from '../controllers/webhook.controller.js';

const router = express.Router();




router.post('/stream', handleStreamWebhook);




router.post('/stream/presend-message', handlePresendMessageHook);

export default router;

