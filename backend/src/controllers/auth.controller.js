import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// Generate JWT token
const generateToken = (userId) => {
    console.log("=== Token Generation ===");
    console.log("Input userId:", userId);
    console.log("JWT_SECRET length:", process.env.JWT_SECRET?.length || 0);
    
    if (!process.env.JWT_SECRET) {
        const error = new Error("JWT_SECRET is not defined");
        console.error("Token generation error:", error.message);
        throw error;
    }
    
    try {
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
            expiresIn: "15d",
        });
        console.log("Token generated successfully");
        return token;
    } catch (error) {
        console.error("Token generation failed:", error.message);
        throw error;
    }
};

// Register user
export const registerUser = async (req, res) => {
    try {
        console.log("=== Register User Request ===");
        console.log("Request body:", JSON.stringify(req.body, null, 2));
        
        const { name, email, password } = req.body;
        
        // Validate input
        if (!name || !email || !password) {
            console.log("Missing required fields");
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        // Check if user already exists
        console.log("Checking if user exists with email:", email);
        const userExists = await User.findOne({ email });
        console.log("User exists check result:", userExists ? "User found" : "User not found");
        
        if (userExists) {
            console.log("User already exists");
            return res.status(400).json({ message: "User already exists" });
        }

        // Create user
        console.log("Creating new user with name:", name, "email:", email);
        const user = await User.create({
            name,
            email,
            password,
        });
        console.log("User created successfully with ID:", user._id);

        // Generate token
        console.log("Generating token for user:", user._id);
        const token = generateToken(user._id);

        const response = {
            _id: user._id,
            name: user.name,
            email: user.email,
            token,
        };
        
        console.log("Registration response:", JSON.stringify(response, null, 2));
        res.status(201).json(response);
    } catch (error) {
        console.log("=== Registration Error ===");
        console.error("Error in registerUser:", error);
        console.error("Error details:", {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        
        // Handle specific error types
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: "Validation error", errors: messages });
        }
        
        if (error.name === 'MongoServerError' && error.code === 11000) {
            return res.status(400).json({ message: "User already exists" });
        }
        
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message,
            // Remove stack in production
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Login user
export const loginUser = async (req, res) => {
    try {
        console.log("=== Login User Request ===");
        console.log("Request body:", JSON.stringify(req.body, null, 2));
        
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            console.log("Missing email or password");
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user by email
        console.log("Finding user by email:", email);
        const user = await User.findOne({ email }).select("+password");
        console.log("User find result:", user ? "User found" : "User not found");
        
        if (!user) {
            console.log("Invalid credentials - user not found");
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check password
        console.log("Checking password for user:", user.email);
        const isPasswordCorrect = await user.comparePassword(password);
        console.log("Password check result:", isPasswordCorrect ? "Correct" : "Incorrect");
        
        if (!isPasswordCorrect) {
            console.log("Invalid credentials - incorrect password");
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate token
        console.log("Generating token for user:", user._id);
        const token = generateToken(user._id);

        const response = {
            _id: user._id,
            name: user.name,
            email: user.email,
            token,
        };
        
        console.log("Login response:", JSON.stringify(response, null, 2));
        res.status(200).json(response);
    } catch (error) {
        console.log("=== Login Error ===");
        console.error("Error in loginUser:", error);
        console.error("Error details:", {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message,
            // Remove stack in production
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};