import express from "express";
import { getStreamToken } from "../controllers/chat.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply JWT protection to all chat routes
router.use(protectRoute);

// Get Stream token
router.get("/stream-token", getStreamToken);

export default router;