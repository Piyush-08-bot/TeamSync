import mongoose from "mongoose";
import {ENV} from "./env.js";

export const connectDB = async()=>{
    try{
        const cnn = await mongoose.connect(ENV.MONGO_URI);
        console.log("MongoDB Connected Successfully:", cnn.connection.host);
    }catch(e){
        console.error("DB Connection Failed", e);
        process.exit(1); // status code 1 means error, 0 means success
    }
}