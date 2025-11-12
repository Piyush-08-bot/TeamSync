import mongoose from "mongoose";
import { ENV } from "./env.js";

let connectionPromise = null;
let isConnected = false;

export const connectDB = async () => {
    // If we're already connected, return the existing connection
    if (isConnected && mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    // If we have a pending connection, return that promise
    if (connectionPromise) {
        return connectionPromise;
    }

    // Create new connection promise
    connectionPromise = new Promise(async (resolve, reject) => {
        try {
            console.log("Attempting to connect to MongoDB...");
            console.log("MONGO_URI:", ENV.MONGO_URI ? "Set" : "Not set");

            if (!ENV.MONGO_URI) {
                throw new Error("MONGO_URI is not defined in environment variables");
            }

            // Configure mongoose connection options for better performance in serverless environments
            const options = {
                serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
                maxPoolSize: 10, // Maintain up to 10 socket connections
            };

            const connection = await mongoose.connect(ENV.MONGO_URI, options);
            isConnected = true;
            console.log("MongoDB Connected Successfully:", connection.connection.host);
            console.log("Database Name:", connection.connection.name);
            console.log("Connection State:", mongoose.connection.readyState);
            resolve(connection);
        } catch (error) {
            isConnected = false;
            connectionPromise = null;
            console.error("DB Connection Failed:", error);
            console.error("Error details:", {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            reject(error);
        }
    });

    return connectionPromise;
};

// Check if database is connected
export const isDBConnected = () => {
    return isConnected && mongoose.connection.readyState === 1;
};

// Export a function to disconnect (useful for serverless environments)
export const disconnectDB = async () => {
    if (connectionPromise) {
        try {
            await mongoose.disconnect();
            console.log("MongoDB disconnected");
        } catch (error) {
            console.error("Error disconnecting from MongoDB:", error);
        } finally {
            connectionPromise = null;
            isConnected = false;
        }
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to DB');
    isConnected = true;
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
    isConnected = false;
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
    isConnected = false;
});