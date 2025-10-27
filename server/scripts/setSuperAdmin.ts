import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codestreak';

async function setSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find and update user by email
    const email = 'dond2674@gmail.com';
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: 'superAdmin' },
      { new: true, upsert: false }
    );

    if (user) {
      console.log(`✅ Successfully set ${email} as superAdmin`);
      console.log('User details:', {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        firebaseUid: user.firebaseUid
      });
    } else {
      console.log(`❌ User with email ${email} not found in database`);
      console.log('💡 The user will be automatically set as superAdmin when they log in for the first time');
      console.log('💡 Or make sure the user has logged in at least once, then run this script again');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setSuperAdmin();

