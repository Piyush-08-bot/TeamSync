import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { connectDB } from "../config/db.js";
import { upsertStreamUser } from "../config/streamConfig.js";
import { ENV } from "../config/env.js";

const generateToken = (userId) => {
    console.log('Generating token for userId:', userId);
    console.log('JWT_SECRET present:', !!ENV.JWT_SECRET);
    if (!ENV.JWT_SECRET) {
        console.error("CRITICAL ERROR: JWT_SECRET is missing in environment variables!");
        throw new Error("JWT_SECRET is not configured");
    }
    const token = jwt.sign({ userId }, ENV.JWT_SECRET, { expiresIn: "15d" });
    console.log('Token generated successfully');
    return token;
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

        // Upsert user to Stream Chat
        try {
            await upsertStreamUser(user);
        } catch (streamError) {
            console.error("Failed to upsert user to Stream Chat:", streamError.message);
            // Don't fail the registration if Stream upsert fails
        }

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
        res.status(500).json({
            message: "Registration failed",
            error: error.message,
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        console.log('Login attempt for email:', req.body.email);
        await connectDB();
        const { email, password } = req.body;

        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ message: "Email and password are required" });
        }

        console.log('Finding user with email:', email);
        const user = await User.findOne({ email }).select('+password');
        console.log('User found:', !!user);

        if (!user) {
            console.log('User not found');
            return res.status(400).json({ message: "Invalid credentials" });
        }

        console.log('Comparing password for user:', user._id);
        const isPasswordCorrect = await user.comparePassword(password);
        console.log('Password correct:', isPasswordCorrect);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Upsert user to Stream Chat on login
        try {
            await upsertStreamUser(user);
        } catch (streamError) {
            console.error("Failed to upsert user to Stream Chat:", streamError.message);
            // Don't fail the login if Stream upsert fails
        }

        console.log('Generating token for user:', user._id);
        const token = generateToken(user._id);
        console.log('Token generated successfully');

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
        console.error("Error stack:", error.stack);
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
            profilePic: user.profilePic,
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
        console.log('=== updateUserProfile called ===');
        console.log('Request body:', req.body);
        console.log('User ID:', req.user._id);

        await connectDB();
        const { name, bio, profilePic } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update fields if provided
        if (name !== undefined) user.name = name;
        if (bio !== undefined) user.Bio = bio;
        if (profilePic !== undefined) user.profilePic = profilePic;

        // Mark user as onboarded when they update their profile
        user.isOnboarded = true;

        const updatedUser = await user.save();

        // Upsert updated user to Stream Chat
        try {
            await upsertStreamUser(updatedUser);
        } catch (streamError) {
            console.error("Failed to upsert user to Stream Chat:", streamError.message);
            // Don't fail the update if Stream upsert fails
        }

        console.log('User profile updated successfully:', updatedUser._id);

        res.status(200).json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            bio: updatedUser.Bio,
            profilePic: updatedUser.profilePic,
            isOnboarded: updatedUser.isOnboarded,
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