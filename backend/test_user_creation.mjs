import { User } from "./src/models/user.model.js";
import { connectDB } from "./src/config/db.js";

async function testUserCreation() {
    try {
        await connectDB();
        console.log('Connected to database');

        // Create a test user
        const userData = {
            name: 'Test Creation User',
            email: 'testcreation@example.com',
            password: 'password123'
        };

        console.log('Creating user with data:', userData);

        const user = new User(userData);
        console.log('User object before save:', user);
        console.log('Password before save:', user.password);
        console.log('Is password modified:', user.isModified('password'));

        // Save the user
        await user.save();

        console.log('User saved successfully');
        console.log('User object after save:', user);
        console.log('Password after save:', user.password);

        // Try to find the user
        const foundUser = await User.findOne({ email: 'testcreation@example.com' });
        console.log('Found user:', foundUser);
        console.log('Found user password:', foundUser.password);

    } catch (error) {
        console.error('Error:', error);
    }
}

testUserCreation();