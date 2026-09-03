/**
 * Zero-install dev server: boots an in-memory MongoDB, seeds it, and starts the
 * API — handy when you don't have a local mongod. Data is wiped on exit.
 *   npm run dev:mem
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create({ instance: { dbName: 's2vestis' } });
process.env.MONGO_URI = mongod.getUri('s2vestis');
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'dev_in_memory_secret';

console.log('🧪 In-memory MongoDB started');

const { connectDB } = await import('../src/config/db.js');
const { seedDatabase } = await import('../src/seed/seedData.js');
await connectDB(process.env.MONGO_URI);
await seedDatabase();

const { default: app } = await import('../src/app.js');
const { env } = await import('../src/config/env.js');
const server = app.listen(env.port, () => {
  console.log(`🚀 S2VESTIS API (in-memory) at http://localhost:${env.port}`);
});

const shutdown = async () => {
  console.log('\nShutting down in-memory server…');
  server.close();
  await mongod.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
