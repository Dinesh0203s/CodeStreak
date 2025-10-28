#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting CodeStreak Full-Stack Application...\n');

// Start backend
console.log('📡 Starting backend server...');
const backend = spawn('node', ['backend/server.js'], {
  stdio: 'inherit',
  shell: true
});

// Start frontend after a short delay
setTimeout(() => {
  console.log('🌐 Starting frontend development server...');
  const frontend = spawn('npm', ['start'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, BROWSER: 'none' }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

}, 2000);

// Handle backend errors
backend.on('error', (err) => {
  console.error('❌ Backend error:', err);
});

backend.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend exited with code ${code}`);
  }
});

