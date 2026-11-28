import { createServer } from 'node:http';
import app from './app.js';
import { connectMongo } from './config/db.js';
import { env } from './config/env.js';
import { attachRealtime } from './services/realtime.js';

async function startServer() {
  await connectMongo();

  const server = createServer(app);
  attachRealtime(server);
  server.listen(env.port, () => {
    console.log(`Server is running on http://localhost:${env.port}`);
  });
}

startServer();
