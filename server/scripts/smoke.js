/**
 * End-to-end smoke test against the LIVE Supabase project configured in
 * server/.env (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). Reseeds known demo
 * data first, then drives the real running Express app over HTTP.
 *   npm run smoke
 * ⚠️ Reseeding wipes all app data in that Supabase project — never point this
 * at a project holding real data.
 */
import bcrypt from 'bcryptjs';

let passed = 0;
let failed = 0;
const results = [];

function check(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    results.push(`  ✅ ${name}`);
  } else {
    failed += 1;
    results.push(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  const { env } = await import('../src/config/env.js');
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set in server/.env');
    process.exit(1);
  }

  const { supabase } = await import('../src/config/supabase.js');
  const adminHash = await bcrypt.hash('Admin@12345', 10);
  const userHash = await bcrypt.hash('User@12345', 10);
  const { error: seedErr } = await supabase.rpc('reseed_demo_data', {
    p_admin_password_hash: adminHash,
    p_user_password_hash: userHash,
  });
  if (seedErr) {
    console.error('Reseed failed:', seedErr.message);
    process.exit(1);
  }
  console.log(`Target: ${env.supabaseUrl}\n(reseeded demo data)\n`);

  const { default: app } = await import('../src/app.js');
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;

  const jar = new Map();
  const rememberCookies = (res) => {
    for (const raw of res.headers.getSetCookie?.() || []) {
      const [pair] = raw.split(';');
      const eq = pair.indexOf('=');
      if (eq === -1) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (value === '' || value === 'deleted') jar.delete(name);
      else jar.set(name, value);
    }
  };
  const cookieHeader = () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  const api = async (method, path, body) => {
    const cookies = cookieHeader();
    const res = await fetch(base + path, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(cookies ? { cookie: cookies } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    rememberCookies(res);
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* non-json */
    }
    return { status: res.status, json };
  };

  try {
    let r = await api('GET', '/api/health');
    check('GET /api/health → 200', r.status === 200 && r.json?.status === 'ok');

    r = await api('GET', '/api/categories?withCounts=true');
    check('GET /api/categories → 8 categories', r.json?.data?.length === 8, `got ${r.json?.data?.length}`);
    check('categories carry productCount', r.json?.data?.every((c) => typeof c.productCount === 'number'));

    r = await api('GET', '/api/products?limit=6&page=1');
    check('GET /api/products → paginated', r.json?.data?.length === 6, `got ${r.json?.data?.length}`);
    check('pagination.total === 33', r.json?.pagination?.total === 33, `total ${r.json?.pagination?.total}`);
    const sampleSlug = r.json.data[0].slug;

    r = await api('GET', '/api/products?gender=women&limit=50');
    check('gender=women filter works', r.json?.data?.length > 0 && r.json.data.every((p) => p.gender === 'women'));

    r = await api('GET', '/api/products?category=hoodies&limit=50');
    check(
      'category=hoodies filter works',
      r.json?.data?.length > 0 && r.json.data.every((p) => p.category?.slug === 'hoodies')
    );

    r = await api('GET', '/api/products?sort=price-asc&limit=50');
    let prices = (r.json?.data || []).map((p) => p.effectivePrice);
    check('sort=price-asc is ascending', prices.every((v, i) => i === 0 || prices[i - 1] <= v));

    r = await api('GET', '/api/products?sort=price-desc&limit=50');
    prices = (r.json?.data || []).map((p) => p.effectivePrice);
    check('sort=price-desc is descending', prices.every((v, i) => i === 0 || prices[i - 1] >= v));

    r = await api('GET', '/api/products?minPrice=3000&limit=50');
    check('minPrice filter works', r.json?.data?.every((p) => p.effectivePrice >= 3000));

    r = await api('GET', '/api/products?search=hoodie&limit=50');
    check('search=hoodie returns hits', (r.json?.data?.length || 0) > 0);

    r = await api('GET', '/api/products?featured=true&limit=50');
    check(
      'featured=true returns only featured',
      r.json?.data?.length > 0 && r.json.data.every((p) => p.isFeatured === true)
    );

    r = await api('GET', '/api/products?size=XS,XXL&limit=50');
    check(
      'multi-size filter (size=XS,XXL) returns matches',
      (r.json?.data?.length || 0) > 0 &&
        r.json.data.every((p) => p.variants.some((v) => v.sizes.some((s) => ['XS', 'XXL'].includes(s.size))))
    );

    r = await api('GET', '/api/products?color=Black&color=Navy&limit=50');
    check(
      'repeated color param (Black + Navy) returns matches',
      (r.json?.data?.length || 0) > 0 &&
        r.json.data.every((p) => p.variants.some((v) => ['black', 'navy'].includes(v.color.toLowerCase())))
    );

    {
      const all = await api('GET', '/api/products?limit=3');
      const wantIds = all.json.data.map((p) => p._id);
      r = await api('GET', `/api/products?ids=${wantIds.join(',')}&limit=50`);
      const gotIds = (r.json?.data || []).map((p) => p._id).sort();
      check(
        'ids= filter returns exactly the requested products',
        gotIds.length === 3 && JSON.stringify(gotIds) === JSON.stringify([...wantIds].sort())
      );
    }

    r = await api('GET', `/api/products/${sampleSlug}`);
    check('GET /api/products/:slug → detail', r.json?.data?.slug === sampleSlug);
    const detail = r.json.data;
    check(
      'detail has variants with images + sizes',
      detail.variants?.length > 0 && detail.variants[0].images.length > 0 && detail.variants[0].sizes.length > 0
    );
    check('discountPercent computed when discounted', detail.discountPrice == null || detail.discountPercent > 0);

    r = await api('GET', `/api/products/${sampleSlug}/related`);
    check(
      'related excludes the product itself',
      Array.isArray(r.json?.data) && r.json.data.every((p) => p.slug !== sampleSlug)
    );

    r = await api('GET', '/api/products/does-not-exist-xyz');
    check('unknown slug → 404', r.status === 404 && r.json?.success === false);

    r = await api('POST', '/api/auth/register', { email: 'bad' });
    check(
      'register validation → 400 with errors[]',
      r.status === 400 && Array.isArray(r.json?.errors) && r.json.errors.length > 0
    );

    r = await api('GET', '/api/cart');
    check('guest GET /api/cart → empty', r.json?.cart?.items?.length === 0);

    const variant = detail.variants[0];
    const inStockSize = variant.sizes.find((s) => s.stock > 0);
    r = await api('POST', '/api/cart/add', {
      productId: detail._id,
      color: variant.color,
      size: inStockSize.size,
      quantity: 2,
    });
    check('guest cart add → 201', r.status === 201 && r.json?.cart?.count === 2, JSON.stringify(r.json));
    check('cart subtotal = price * qty', r.json?.cart?.subtotal === r.json.cart.items[0].priceAtAdd * 2);
    const itemId = r.json.cart.items[0]._id;

    r = await api('PUT', '/api/cart/update', { itemId, quantity: 3 });
    check('guest cart update qty → 3', r.json?.cart?.items?.[0]?.quantity === 3);

    r = await api('POST', '/api/cart/add', {
      productId: detail._id,
      color: variant.color,
      size: inStockSize.size,
      quantity: 999,
    });
    check('over-stock add → 400', r.status === 400);

    const oosSize = variant.sizes.find((s) => s.stock === 0);
    if (oosSize) {
      r = await api('POST', '/api/cart/add', {
        productId: detail._id,
        color: variant.color,
        size: oosSize.size,
        quantity: 1,
      });
      check('out-of-stock size add → 400', r.status === 400);
    } else {
      check('out-of-stock size add → 400 (skipped: no OOS size on sample)', true);
    }

    r = await api('POST', '/api/auth/register', {
      name: 'Smoke Tester',
      email: `smoke_${Date.now()}@test.com`,
      password: 'secret123',
    });
    check('register → 201 + user', r.status === 201 && Boolean(r.json?.user?.email));

    r = await api('GET', '/api/cart');
    check('guest cart merged into user on register', r.json?.cart?.count === 3, `count ${r.json?.cart?.count}`);

    r = await api('GET', '/api/auth/me');
    check('GET /api/auth/me → user', r.json?.user?.role === 'user');

    r = await api('POST', '/api/wishlist/add', { productId: detail._id });
    check('wishlist add → 201', r.status === 201 && r.json?.data?.count === 1);
    r = await api('POST', '/api/wishlist/add', { productId: detail._id });
    check('wishlist add is idempotent', r.json?.data?.count === 1);
    r = await api('DELETE', `/api/wishlist/remove/${detail._id}`);
    check('wishlist remove → 0', r.json?.data?.count === 0);

    // ---- payments (user still has 3 cart items from the merge) ----
    // Orders are no longer created directly — only via a verified Razorpay
    // payment (see paymentController.js). This whole block needs real
    // Razorpay TEST-mode keys in server/.env (RAZORPAY_KEY_ID/SECRET) —
    // createCheckout calls Razorpay's real API to size an order.
    r = await api('POST', '/api/orders');
    check('POST /api/orders (removed demo route) → 404', r.status === 404);

    const checkoutAddress = {
      fullName: 'Smoke Tester',
      phone: '9876543210',
      line1: '1 Test Lane',
      city: 'Mumbai',
      state: 'MH',
      postalCode: '400001',
    };
    r = await api('POST', '/api/payments/checkout', { address: checkoutAddress });
    check(
      'POST /api/payments/checkout → 201 with a Razorpay order',
      r.status === 201 && !!r.json?.data?.razorpayOrderId && !!r.json?.data?.keyId,
      JSON.stringify(r.json)
    );
    check(
      'checkout quote covers all 3 cart items',
      r.json?.data?.orderSummary?.itemCount === 3,
      `got ${r.json?.data?.orderSummary?.itemCount}`
    );
    const razorpayOrderId = r.json?.data?.razorpayOrderId;

    r = await api('GET', '/api/cart');
    check(
      'cart is untouched by checkout (no order/stock change until payment is verified)',
      r.json?.cart?.count === 3,
      `count ${r.json?.cart?.count}`
    );

    r = await api('POST', '/api/payments/verify', {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: 'pay_smoketest_fake',
      razorpay_signature: 'not-a-real-signature',
    });
    check('verify with a forged signature → 400', r.status === 400);

    r = await api('GET', '/api/orders');
    check('no order was created from the forged verify attempt', r.json?.data?.length === 0);

    r = await api('GET', '/api/admin/stats');
    check('normal user hits /api/admin → 403', r.status === 403);

    r = await api('POST', '/api/auth/login', { email: 'admin@s2vestis.com', password: 'Admin@12345' });
    check('admin login → 200', r.status === 200 && r.json?.user?.role === 'admin');

    r = await api('GET', '/api/admin/stats');
    check('admin stats → counts', r.status === 200 && r.json?.data?.totalProducts === 33);

    r = await api('GET', '/api/admin/products?limit=5&status=active');
    check('admin product list → paginated', r.json?.data?.length === 5);

    r = await api('POST', '/api/admin/categories', { name: 'Smoke Caps' });
    check('admin create category → 201', r.status === 201 && r.json?.data?.slug === 'smoke-caps');
    const newCatId = r.json.data._id;

    r = await api('POST', '/api/admin/products', {
      name: 'Smoke Test Cap',
      description: 'A cap created by the smoke test.',
      category: newCatId,
      gender: 'unisex',
      price: 1000,
      discountPrice: 750,
      variants: [
        {
          color: 'Black',
          colorHex: '#111111',
          images: ['https://picsum.photos/seed/smoke-cap/900/1200'],
          sizes: [{ size: 'One Size', stock: 10 }],
        },
      ],
      isActive: true,
    });
    check('admin create product → 201', r.status === 201, JSON.stringify(r.json));
    check('created product discountPercent = 25', r.json?.data?.discountPercent === 25);
    check('created product effectivePrice = 750', r.json?.data?.effectivePrice === 750);
    const newProdId = r.json.data._id;

    r = await api('PUT', `/api/admin/products/${newProdId}`, { discountPrice: null, price: 1200 });
    check(
      'admin update clears discount',
      r.json?.data?.discountPercent === 0 && r.json?.data?.effectivePrice === 1200,
      JSON.stringify(r.json?.data)
    );

    r = await api('PUT', `/api/admin/products/${newProdId}`, { isActive: false });
    check('admin can set inactive', r.json?.data?.isActive === false);

    r = await api('GET', '/api/products/smoke-test-cap-unisex');
    check('inactive product hidden from public detail → 404', r.status === 404);

    r = await api('DELETE', `/api/admin/products/${newProdId}`);
    check('admin delete product → 200', r.status === 200);

    r = await api('DELETE', `/api/admin/categories/${newCatId}`);
    check('admin delete now-empty category → 200', r.status === 200);

    r = await api('GET', '/api/categories');
    const usedCat = r.json.data.find((c) => c.slug === 'hoodies');
    r = await api('DELETE', `/api/admin/categories/${usedCat._id}`);
    check('delete in-use category → 400', r.status === 400);

    // ---- admin orders (Phase 11) ----
    r = await api('GET', '/api/admin/orders?limit=5');
    check('admin orders list → paginated', r.status === 200 && Array.isArray(r.json?.data));
    r = await api('GET', '/api/admin/orders/00000000-0000-0000-0000-000000000000');
    check('admin get unknown order → 404', r.status === 404);

    // ---- forgot/reset password (Phase 12) — same response either way, so
    // this can't be used to check which emails have accounts. ----
    r = await api('POST', '/api/auth/forgot-password', { email: 'admin@s2vestis.com' });
    const realMsg = r.json?.message;
    check('forgot-password (real account) → 200', r.status === 200);
    r = await api('POST', '/api/auth/forgot-password', { email: 'definitely-not-registered@test.com' });
    check(
      'forgot-password (unknown email) → same 200 + message as a real account',
      r.status === 200 && r.json?.message === realMsg
    );

    r = await api('POST', '/api/auth/reset-password', { token: 'not-a-real-token', password: 'newpass123' });
    check('reset-password with a bogus token → 400', r.status === 400);

    r = await api('POST', '/api/auth/logout');
    check('logout → 200', r.status === 200);
    r = await api('GET', '/api/auth/me');
    check('after logout, me → null user', r.json?.user === null);

    r = await api('GET', '/api/orders');
    check('GET /api/orders as guest → 401', r.status === 401);

    r = await api('GET', '/api/admin/orders');
    check('admin orders list as guest → 401', r.status === 401);
  } finally {
    server.close();
  }

  console.log('\n' + results.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('smoke runner crashed:', err);
  process.exit(1);
});
