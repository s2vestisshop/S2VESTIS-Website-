-- S2VESTIS · demo seed (SQL Editor convenience wrapper)
-- Loads 8 categories, ~33 products, an admin + demo user, and 2 coupons via
-- public.reseed_demo_data() (defined in migration 0010). The Node script
-- `server/npm run seed` calls the same function over the network with
-- freshly-hashed passwords from server/.env — use that instead if you've
-- changed SEED_ADMIN_PASSWORD / SEED_USER_PASSWORD.
--
-- Default passwords baked into these hashes: Admin@12345 / User@12345

select public.reseed_demo_data(
  '$2a$10$rt.fgH433Xl4gd8lnmzfdu.fbNqqWirfRIMRNNXspAxgy3AvQJBBW',  -- Admin@12345
  '$2a$10$dmVzyO/TBiIQdJIP6Mxojedtt6saDAeKC7qsmcPVwQIeoAO5BXOYq'   -- User@12345
);
