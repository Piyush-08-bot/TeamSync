import bcrypt from 'bcryptjs';

// Test bcrypt functions
async function testBcrypt() {
    try {
        const password = 'password123';
        console.log('Original password:', password);

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Hashed password:', hashedPassword);

        // Compare the password
        const isMatch = await bcrypt.compare(password, hashedPassword);
        console.log('Password match:', isMatch);

        // Try comparing with wrong password
        const isWrongMatch = await bcrypt.compare('wrongpassword', hashedPassword);
        console.log('Wrong password match:', isWrongMatch);
    } catch (error) {
        console.error('Error:', error);
    }
}

testBcrypt();