import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { connectDB } from "../config/db.js";

export const protectRoute = async (req, res, next) => {
    try {
        await connectDB();

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No authentication token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid authentication token" });
        }
        if (err.name === 'MongoServerSelectionError' || err.message.includes('buffering timed out')) {
            return res.status(503).json({
                message: "Database temporarily unavailable. Please try again.",
            });
        }
        return res.status(401).json({ message: "Authentication failed" });
    }
};