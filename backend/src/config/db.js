import mongoose from "mongoose";
import {ENV} from "./env.js";

export const connectDB = async()=>{
    try{
        console.log("Attempting to connect to MongoDB...");
        console.log("MONGO_URI:", ENV.MONGO_URI ? "Set" : "Not set");
        
        // Remove deprecated options
        const cnn = await mongoose.connect(ENV.MONGO_URI);
        console.log("MongoDB Connected Successfully:", cnn.connection.host);
        console.log("Database Name:", cnn.connection.name);
    }catch(e){
        console.error("DB Connection Failed:", e);
        console.error("Error details:", {
            message: e.message,
            name: e.name,
            stack: e.stack
        });
        process.exit(1); // status code 1 means error, 0 means success
    }
}