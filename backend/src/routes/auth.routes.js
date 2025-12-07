import express from "express";
import { registerUser, loginUser, getCurrentUser, updateUserProfile, deleteUser } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protectRoute, getCurrentUser);

router.put("/profile", protectRoute, updateUserProfile);
router.delete("/profile", protectRoute, deleteUser);

export default router;