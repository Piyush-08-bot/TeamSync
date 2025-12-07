import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { connectDB } from "../config/db.js";

import { ENV } from "../config/env.js";

const generateToken = (userId) => {
    if (!ENV.JWT_SECRET) {
        console.error("CRITICAL ERROR: JWT_SECRET is missing in environment variables!");
        throw new Error("JWT_SECRET is not configured");
    }
    return jwt.sign({ userId }, ENV.JWT_SECRET, { expiresIn: "15d" });
};

export const registerUser = async (req, res) => {
    try {
        await connectDB();
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const user = await User.create({ name, email, password });
        const token = generateToken(user._id);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            bio: user.Bio,  
            isOnboarded: user.isOnboarded,
            token,
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: "Validation failed", errors: messages });
        }

        if (error.name === 'MongoServerError' && error.code === 11000) {
            return res.status(400).json({ message: "Email already exists" });
        }

        if (error.name === 'MongoServerSelectionError' || error.message.includes('buffering timed out')) {
            return res.status(503).json({
                message: "Database temporarily unavailable. Please try again.",
            });
        }

        res.status(500).json({
            message: "Registration failed",
            error: error.message,
        });
    }
};

import fs from 'fs';
import path from 'path';

export const loginUser = async (req, res) => {
    try {
        await connectDB();
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            bio: user.Bio,
            isOnboarded: user.isOnboarded,
            token,
        });
    } catch (error) {
        console.error("Login error:", error.message);

        
        try {
            const logPath = path.resolve(process.cwd(), 'error.log');
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] Login Error: ${error.message}\nStack: ${error.stack}\n\n`;
            fs.appendFileSync(logPath, logMessage);
        } catch (logErr) {
            console.error("Failed to write to error log:", logErr);
        }

        if (error.name === 'MongoServerSelectionError' || error.message.includes('buffering timed out')) {
            return res.status(503).json({
                message: "Database temporarily unavailable. Please try again.",
            });
        }

        res.status(500).json({
            message: "Login failed",
            error: error.message,
        });
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        await connectDB();

        
        const user = await User.findById(req.user._id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            bio: user.Bio,  
            isOnboarded: user.isOnboarded,
        });
    } catch (error) {
        console.error("Get current user error:", error.message);
        res.status(500).json({
            message: "Failed to get user data",
            error: error.message,
        });
    }
};


export const updateUserProfile = async (req, res) => {
    try {
        await connectDB();

        const { name, bio, profilePic } = req.body;
        const userId = req.user._id;

        
        if (!name) {
            return res.status(400).json({ message: "Name is required" });
        }

        
        const user = await User.findByIdAndUpdate(
            userId,
            {
                name,
                Bio: bio,  
                profilePic,
                isOnboarded: true
            },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            bio: user.Bio,  
            profilePic: user.profilePic,
            isOnboarded: user.isOnboarded,
        });
    } catch (error) {
        console.error("Update profile error:", error.message);
        console.error("Error stack:", error.stack);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: "Validation failed", errors: messages });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({ message: "Invalid user ID format" });
        }

        res.status(500).json({
            message: "Failed to update profile",
            error: error.message,
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        await connectDB();
        const userId = req.user._id;

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error.message);
        res.status(500).json({
            message: "Failed to delete user",
            error: error.message,
        });
    }
};
