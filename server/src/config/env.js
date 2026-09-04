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

export const isProd = env.nodeEnv === 'production';
