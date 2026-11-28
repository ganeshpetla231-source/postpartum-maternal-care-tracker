import { createServer } from 'node:http';
import app from './app.js';
import { connectMongo } from './config/db.js';
import { env } from './config/env.js';
import { attachRealtime } from './services/realtime.js';

async function startServer() {
  await connectMongo();

  const server = createServer(app);
  attachRealtime(server);
  server.listen(env.port, '0.0.0.0', () => {
    console.log(`Server running on port ${env.port}`);
  });
}

startServer().catch(() => {
  console.error('Server startup failed. Check MongoDB and Render environment variables.');
  process.exit(1);
});
