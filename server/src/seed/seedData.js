/**
 * Seed logic, decoupled from any connection handling so it can be driven by
 * both the CLI (seed.js) and the smoke test.
 * Placeholder images use picsum.photos (deterministic via /seed/<key>).
 */
import { env } from '../config/env.js';
import { toSlug } from '../utils/slug.js';

import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import Order from '../models/Order.js';

const log = (...args) => console.log(...args);

const img = (key, i) => `https://picsum.photos/seed/s2v-${toSlug(key)}-${i}/900/1200`;
const variantImages = (key, count = 3) =>
  Array.from({ length: count }, (_, i) => img(key, i + 1));

const COLORS = {
  Black: '#111111',
  White: '#F7F7F5',
  Navy: '#1F2A44',
  'Olive Green': '#5A5F3C',
  Charcoal: '#3A3A3A',
  Beige: '#D8C7A9',
  'Sky Blue': '#8FB8DE',
  Maroon: '#5E1F2B',
  'Forest Green': '#2E4034',
  Rust: '#A5522D',
  'Powder Pink': '#E7C6C9',
  Lilac: '#C3B1D9',
};

const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const sizeRows = (sizes, stockFn) => sizes.map((size) => ({ size, stock: stockFn(size) }));

const CATEGORIES = [
  'T-Shirts',
  'Polo',
  'Tees',
  'Shirts',
  'Linen Shirts',
  'Sportswear',
  'Sweatshirts',
  'Hoodies',
].map((name) => ({ name, gender: 'unisex' }));

// [category, name, gender, price, discountPrice|null, isFeatured, [colorNames]]
const PRODUCT_BLUEPRINTS = [
  ['T-Shirts', 'Everyday Supima Crew Tee', 'men', 1299, 999, true, ['Black', 'White', 'Navy']],
  ['T-Shirts', 'Heavyweight Boxy Tee', 'men', 1499, null, false, ['Charcoal', 'Beige']],
  ['T-Shirts', 'Relaxed Pima Crew Tee', 'women', 1299, 1049, true, ['White', 'Powder Pink', 'Sky Blue']],
  ['T-Shirts', 'Pima Scoop-Neck Tee', 'women', 1199, null, false, ['Black', 'Lilac']],
  ['T-Shirts', 'Organic Cotton Pocket Tee', 'unisex', 1399, 1119, false, ['Olive Green', 'White']],

  ['Polo', 'Pique Cotton Polo', 'men', 1999, 1599, true, ['Navy', 'White', 'Maroon']],
  ['Polo', 'Textured Knit Polo', 'men', 2499, null, false, ['Forest Green', 'Charcoal']],
  ['Polo', 'Slim Stretch Polo', 'women', 1899, 1519, false, ['Black', 'Sky Blue']],
  ['Polo', 'Tipped Collar Polo', 'unisex', 2199, null, true, ['White', 'Navy']],

  ['Tees', 'Vintage Wash Graphic Tee', 'men', 1599, 1279, true, ['Black', 'Rust']],
  ['Tees', 'Ringer Retro Tee', 'men', 1499, null, false, ['White', 'Navy']],
  ['Tees', 'Slub Cotton Curved-Hem Tee', 'women', 1449, 1159, false, ['Beige', 'Black']],
  ['Tees', 'Acid Wash Oversized Tee', 'unisex', 1699, null, true, ['Charcoal', 'Olive Green']],

  ['Shirts', 'Oxford Button-Down Shirt', 'men', 2799, 2239, true, ['Sky Blue', 'White', 'Navy']],
  ['Shirts', 'Brushed Flannel Overshirt', 'men', 3299, null, false, ['Maroon', 'Forest Green']],
  ['Shirts', 'Poplin Relaxed Shirt', 'women', 2599, 2079, false, ['White', 'Powder Pink']],
  ['Shirts', 'Corduroy Utility Shirt', 'unisex', 3499, 2799, true, ['Rust', 'Charcoal']],

  ['Linen Shirts', 'Pure Linen Resort Shirt', 'men', 2999, 2399, true, ['White', 'Beige', 'Sky Blue']],
  ['Linen Shirts', 'Linen-Blend Band Collar Shirt', 'men', 2699, null, false, ['Olive Green', 'Navy']],
  ['Linen Shirts', 'Breezy Linen Shirt', 'women', 2799, 2239, true, ['White', 'Lilac']],
  ['Linen Shirts', 'Linen Camp-Collar Shirt', 'unisex', 3099, null, false, ['Beige', 'Rust']],

  ['Sportswear', 'Performance Training Tee', 'men', 1799, 1439, true, ['Black', 'Charcoal']],
  ['Sportswear', 'Seamless Run Shorts', 'men', 1999, null, false, ['Black', 'Navy']],
  ['Sportswear', 'High-Rise Compression Leggings', 'women', 2499, 1999, true, ['Black', 'Maroon']],
  ['Sportswear', 'Featherweight Track Jacket', 'unisex', 3499, 2799, false, ['Charcoal', 'Forest Green']],

  ['Sweatshirts', 'Loopback Crew Sweatshirt', 'men', 2599, 2079, true, ['Charcoal', 'Navy', 'Beige']],
  ['Sweatshirts', 'Raglan Fleece Sweatshirt', 'men', 2799, null, false, ['Forest Green', 'Black']],
  ['Sweatshirts', 'Cropped Boxy Sweatshirt', 'women', 2399, 1919, true, ['Powder Pink', 'White']],
  ['Sweatshirts', 'Half-Zip Funnel Sweatshirt', 'unisex', 3199, null, false, ['Olive Green', 'Charcoal']],

  ['Hoodies', 'Heavyweight Pullover Hoodie', 'men', 3299, 2639, true, ['Black', 'Charcoal', 'Olive Green']],
  ['Hoodies', 'Brushed-Back Zip Hoodie', 'men', 3499, null, false, ['Navy', 'Maroon']],
  ['Hoodies', 'Oversized Fleece Hoodie', 'women', 2999, 2399, true, ['Beige', 'Lilac']],
  ['Hoodies', 'Tech Sherpa-Lined Hoodie', 'unisex', 3999, 3199, false, ['Charcoal', 'Forest Green']],
];

export async function wipeDatabase() {
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Cart.deleteMany({}),
    Wishlist.deleteMany({}),
    Order.deleteMany({}),
  ]);
  log('🧹 Cleared users, categories, products, carts, wishlists, orders');
}

export async function seedDatabase({ quiet = false } = {}) {
  const say = quiet ? () => {} : log;
  await wipeDatabase();

  await User.create({
    name: env.seed.adminName,
    email: env.seed.adminEmail,
    password: env.seed.adminPassword,
    role: 'admin',
  });
  await User.create({
    name: 'Demo User',
    email: env.seed.userEmail,
    password: env.seed.userPassword,
    role: 'user',
  });
  say(`👤 Admin: ${env.seed.adminEmail} / ${env.seed.adminPassword}`);
  say(`👤 User:  ${env.seed.userEmail} / ${env.seed.userPassword}`);

  const categoryDocs = await Category.insertMany(
    CATEGORIES.map((c) => ({
      name: c.name,
      slug: toSlug(c.name),
      gender: c.gender,
      image: img(`cat-${c.name}`, 1),
      isActive: true,
    }))
  );
  const catByName = Object.fromEntries(categoryDocs.map((c) => [c.name, c]));
  say(`🏷️  Inserted ${categoryDocs.length} categories`);

  let count = 0;
  for (const [catName, name, gender, price, discountPrice, isFeatured, colorNames] of
    PRODUCT_BLUEPRINTS) {
    const category = catByName[catName];
    const variants = colorNames.map((colorName, idx) => ({
      color: colorName,
      colorHex: COLORS[colorName] || '#888888',
      images: variantImages(`${name}-${colorName}`, 3),
      sizes: sizeRows(APPAREL_SIZES, (size) => {
        if (size === 'XS' && idx === 0) return 0; // one deliberately out-of-stock size
        if (size === 'XXL') return (idx + 1) % 3 === 0 ? 2 : 6;
        return 4 + ((name.length + size.charCodeAt(0) + idx) % 12);
      }),
    }));

    const ratingCount = 8 + ((name.length * 7) % 180);
    const ratingAvg = Math.min(Math.round((3.6 + ((name.length % 12) / 10)) * 10) / 10, 5);
    const fit = gender === 'women' ? "women's" : gender === 'men' ? "men's" : 'unisex';

    // eslint-disable-next-line no-await-in-loop
    await Product.create({
      name,
      slug: toSlug(`${name}-${gender}`),
      description:
        `The ${name} from S2VESTIS. Cut for a modern ${fit} fit in premium fabric with ` +
        `clean finishing and durable stitching. Part of the ${catName} line — easy to layer, ` +
        `built to last wash after wash.`,
      category: category._id,
      gender,
      price,
      discountPrice: discountPrice ?? null,
      variants,
      rating: { avg: ratingAvg, count: ratingCount },
      isFeatured,
      isActive: true,
    });
    count += 1;
  }
  say(`👕 Inserted ${count} products across ${categoryDocs.length} categories`);
  say(`⭐ Featured products: ${PRODUCT_BLUEPRINTS.filter((p) => p[5]).length}`);
  return { categories: categoryDocs.length, products: count };
}
