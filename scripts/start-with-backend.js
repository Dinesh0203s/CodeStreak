import { spawn } from 'child_process';
import fetch from 'node-fetch';

// Start backend server first
console.log('🚀 Starting backend server on port 3000...');
const backend = spawn('npm', ['run', 'server'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

// Wait for backend to be ready (check health endpoint)
const checkBackend = async () => {
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (response.ok) {
        console.log('✅ Backend is ready!');
        return true;
      }
    } catch (error) {
      // Backend not ready yet, continue waiting
    }
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('⚠️  Backend health check timeout, starting frontend anyway...');
  return false;
};

// Wait a bit then check backend, then start frontend
setTimeout(async () => {
  await checkBackend();
  console.log('🎨 Starting frontend server on port 5000...');
  
  const frontend = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  // Handle cleanup
  const cleanup = () => {
    backend.kill();
    frontend.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  backend.on('exit', (code) => {
    console.log(`Backend exited with code ${code}`);
    frontend.kill();
    process.exit(code || 0);
  });

  frontend.on('exit', (code) => {
    console.log(`Frontend exited with code ${code}`);
    backend.kill();
    process.exit(code || 0);
  });
}, 2000); // Wait 2 seconds before checking backend

