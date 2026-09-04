/**
 * Seed CLI for S2VESTIS (Supabase).
 *   npm run seed   → wipes + reloads categories, products, admin/demo users, coupons
 *
 * Delegates to the public.reseed_demo_data() Postgres function (see
 * supabase/migrations/20260904000010_reseed_function.sql) so the SQL Editor
 * and this script share exactly one seeding implementation.
 */
import bcrypt from 'bcryptjs';
import { supabase } from './src/config/supabase.js';
import { env } from './src/config/env.js';

async function main() {
  const adminHash = await bcrypt.hash(env.seed.adminPassword, 10);
  const userHash = await bcrypt.hash(env.seed.userPassword, 10);

  const { data, error } = await supabase.rpc('reseed_demo_data', {
    p_admin_password_hash: adminHash,
    p_user_password_hash: userHash,
  });

  if (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`👤 Admin: ${env.seed.adminEmail} / ${env.seed.adminPassword}`);
  console.log(`👤 User:  ${env.seed.userEmail} / ${env.seed.userPassword}`);
  console.log(`🏷️  Inserted ${data.categories} categories`);
  console.log(`👕 Inserted ${data.products} products`);
  console.log('✅ Done');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
