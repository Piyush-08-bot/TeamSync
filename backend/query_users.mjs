import { User } from "./src/models/user.model.js";
import { connectDB } from "./src/config/db.js";
import { ENV } from "./src/config/env.js";

async function queryUsers() {
    try {
        await connectDB();
        console.log('Connected to database');

        // Find all users
        const users = await User.find({});
        console.log('Total users:', users.length);

        // Print user details
        users.forEach((user, index) => {
            console.log(`User ${index + 1}:`);
            console.log('  ID:', user._id);
            console.log('  Name:', user.name);
            console.log('  Email:', user.email);
            console.log('  Password:', user.password);
            console.log('  Has password:', !!user.password);
            console.log('---');
        });

        // Try to find our debug user specifically
        const debugUser = await User.findOne({ email: 'debug@example.com' });
        if (debugUser) {
            console.log('Debug user found:');
            console.log('  ID:', debugUser._id);
            console.log('  Name:', debugUser.name);
            console.log('  Email:', debugUser.email);
            console.log('  Password:', debugUser.password);
            console.log('  Password type:', typeof debugUser.password);
            console.log('  Password length:', debugUser.password ? debugUser.password.length : 'undefined');
        } else {
            console.log('Debug user not found');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

queryUsers();