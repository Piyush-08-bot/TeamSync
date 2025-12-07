import mongoose from "mongoose";
import { ENV } from "./env.js";

let connectionPromise = null;
let isConnected = false;

export const connectDB = async () => {
    
    if (isConnected && mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    
    if (connectionPromise) {
        return connectionPromise;
    }

    connectionPromise = new Promise(async (resolve, reject) => {
        try {
            if (!ENV.MONGO_URI) {
                throw new Error("MONGO_URI is missing from environment variables");
            }

            
            const options = {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
            };

            const connection = await mongoose.connect(ENV.MONGO_URI, options);
            isConnected = true;
            console.log("✅ MongoDB connected:", connection.connection.host);
            resolve(connection);
        } catch (error) {
            isConnected = false;
            connectionPromise = null;
            console.error("❌ MongoDB connection failed:", error.message);
            reject(error);
        }
    });

    return connectionPromise;
};

export const isDBConnected = () => {
    return isConnected && mongoose.connection.readyState === 1;
};

export const disconnectDB = async () => {
    if (connectionPromise) {
        try {
            await mongoose.disconnect();
            console.log("MongoDB disconnected");
        } catch (error) {
            console.error("Error disconnecting:", error);
        } finally {
            connectionPromise = null;
            isConnected = false;
        }
    }
};

mongoose.connection.on('connected', () => {
    isConnected = true;
});

mongoose.connection.on('error', (err) => {
    console.error('Database error:', err);
    isConnected = false;
});

mongoose.connection.on('disconnected', () => {
    isConnected = false;
});