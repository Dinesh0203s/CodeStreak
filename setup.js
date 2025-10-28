#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up CodeStreak Full-Stack Application...\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
  console.error('❌ Node.js version 16 or higher is required');
  console.error(`   Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `# CodeStreak Environment Variables
# Backend Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FRONTEND_URL=http://localhost:3000

# Database (Mock - no setup required)
MONGODB_URI=mongodb://localhost:27017/codestreak
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  console.error(error.message);
  process.exit(1);
}

// Create necessary directories
const dirs = ['build', 'logs'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    console.log(`✅ Created ${dir} directory`);
  }
});

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Available commands:');
console.log('  npm start          - Start both frontend and backend');
console.log('  npm run dev        - Start in development mode with auto-reload');
console.log('  npm run build      - Build for production');
console.log('  npm run backend    - Start only backend');
console.log('  npm run frontend   - Start only frontend');
console.log('\n🚀 To start the application:');
console.log('  npm start');
console.log('\n🌐 Then open: http://localhost:3000');

