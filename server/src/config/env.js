import dotenv from 'dotenv';

dotenv.config();

const bool = (v, fallback = false) => {
  if (v === undefined) return fallback;
  return String(v).toLowerCase() === 'true';
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5050,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  jwtSecret: process.env.JWT_SECRET || 'dev_insecure_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSecure: bool(process.env.COOKIE_SECURE, false),

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  shiprocket: {
    email: process.env.SHIPROCKET_EMAIL || '',
    password: process.env.SHIPROCKET_PASSWORD || '',
    webhookToken: process.env.SHIPROCKET_WEBHOOK_TOKEN || '',
    pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || '',
    pickupPincode: process.env.SHIPROCKET_PICKUP_PINCODE || '',
  },

  email: {
    apiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'S2VESTIS <onboarding@resend.dev>',
  },
  adminAlertEmail: process.env.ADMIN_ALERT_EMAIL || '',

  seed: {
    adminName: process.env.SEED_ADMIN_NAME || 'Admin',
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@s2vestis.com',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
    userEmail: process.env.SEED_USER_EMAIL || 'user@s2vestis.com',
    userPassword: process.env.SEED_USER_PASSWORD || 'User@12345',
  },
};

export const isCloudinaryConfigured = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);

export const isRazorpayConfigured = Boolean(env.razorpay.keyId && env.razorpay.keySecret);

// Shiprocket is treated as optional/best-effort (unlike Razorpay): a store
// should still be able to take payments before shipping is wired up, and a
// missing/broken Shiprocket config should never take down checkout — see
// services/shiprocket.js and the "retry shipment creation" admin action.
export const isShiprocketConfigured = Boolean(
  env.shiprocket.email && env.shiprocket.password && env.shiprocket.pickupLocation
);

// Also optional/best-effort: with no API key, sendEmail() logs to the
// console instead of failing, so local dev never needs a real Resend account.
export const isEmailConfigured = Boolean(env.email.apiKey);

export const isProd = env.nodeEnv === 'production';
