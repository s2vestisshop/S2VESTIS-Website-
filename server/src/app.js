import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env, isProd } from './config/env.js';
import { attachUser } from './middleware/auth.js';
import { ensureGuestId } from './middleware/guest.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/error.js';
import apiRoutes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow <img> from /uploads
  })
);
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
// `verify` stashes the raw bytes alongside normal parsing — needed to check
// the Razorpay webhook's HMAC signature, which is computed over the exact
// raw body, not the re-serialized parsed object.
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(isProd ? 'combined' : 'dev'));

// Static hosting for locally-stored uploads
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../uploads'), {
    maxAge: '7d',
    fallthrough: true,
  })
);

// Every request gets a guest id + (optional) user attached
app.use(ensureGuestId);
app.use(attachUser);

app.get('/', (_req, res) =>
  res.json({ success: true, name: 'S2VESTIS API', docs: '/api/health' })
);

app.use('/api', apiLimiter, apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
