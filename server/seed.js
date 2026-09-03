/**
 * Seed CLI for S2VESTIS.
 *   npm run seed          → wipe + reseed categories, products, users
 *   npm run seed:destroy  → wipe only
 */
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './src/config/db.js';
import { seedDatabase, wipeDatabase } from './src/seed/seedData.js';

const DESTROY = process.argv.includes('--destroy');

async function main() {
  await connectDB();
  if (DESTROY) await wipeDatabase();
  else await seedDatabase();
  await disconnectDB();
  console.log('✅ Done');
  process.exit(0);
}

main().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    /* noop */
  }
  process.exit(1);
});
