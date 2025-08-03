// Quick server starter script
const { spawn } = require('child_process');

console.log('🚀 Starting Backend Server...');

// Try to start the server
const server = spawn('node', ['working-backend.cjs'], {
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error('💥 Failed to start server:', error.message);
});

server.on('exit', (code) => {
  console.log(`📤 Server process exited with code ${code}`);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});

console.log('🔄 Server starting... Press Ctrl+C to stop');
