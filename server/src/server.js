import app from './app.js';
import { env, isCloudinaryConfigured } from './config/env.js';
import { connectDB } from './config/db.js';

async function start() {
  try {
    await connectDB();

    if (!isCloudinaryConfigured) {
      console.log(
        'ℹ️  Cloudinary keys not set — image uploads will be stored locally in ./uploads'
      );
    }

    const server = app.listen(env.port, () => {
      console.log(`🚀 S2VESTIS API running at http://localhost:${env.port} (${env.nodeEnv})`);
    });

    const shutdown = (signal) => {
      console.log(`\n${signal} received, shutting down...`);
      server.close(() => process.exit(0));
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
