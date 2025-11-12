import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { connectDB } from "../config/db.js";

export const protectRoute = async (req, res, next) => {
    try {
        // Ensure database connection
        await connectDB();

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized - no token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Fetch user from database and attach to request
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(401).json({ message: "Unauthorized - user not found" });
        }
        req.user = user;
        next();
    } catch (err) {
        console.error("Authentication error:", err);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Unauthorized - invalid token" });
        }
        if (err.name === 'MongoServerSelectionError' || err.message.includes('buffering timed out')) {
            return res.status(503).json({
                message: "Service temporarily unavailable. Please try again later.",
                error: "Database connection timeout"
            });
        }
        return res.status(401).json({ message: "Unauthorized - invalid token" });
    }
};