import express from "express";
import { getChatToken as getStreamToken } from "../controllers/streamController.js";
import { searchUser, getAllUsers } from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();


router.use(protectRoute);


router.get("/stream-token", getStreamToken);
router.get("/user/search", searchUser);
router.get("/users", getAllUsers);


router.get("/test", (req, res) => {
    res.json({
        message: "Chat routes are working!",
        path: req.path,
        method: req.method
    });
});

export default router;