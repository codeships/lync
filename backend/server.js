import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

import authRoutes from './routes/auth.route.js';
import profileRoutes from './routes/profile.route.js';
import linksRoutes from './routes/link.route.js';
import publicRoutes from './routes/public.route.js';

import { connectDB } from './config/db.js';

const app = express();

/* --------------------- ENV / CONFIG --------------------- */
const PORT = Number(process.env.PORT) || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

app.set('trust proxy', 1); // needed if behind a proxy and using Secure cookies
app.disable('x-powered-by');

const parseList = (v = '') => v.split(',').map(s => s.trim()).filter(Boolean);

/* ------------------------ CORS -------------------------- */
/** Allow exact origins + wildcard suffixes (e.g. *.vercel.app, *.ngrok.app) */
const EXACT_ORIGINS = new Set(
  [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    process.env.FRONTEND_ORIGIN,
    process.env.PUBLIC_WEB_ORIGIN,
    ...parseList(process.env.ALLOWED_ORIGINS || ''),
  ].filter(Boolean)
);

// Domain suffixes allowed (preview/tunnels)
const SUFFIXES = parseList(
  process.env.ALLOWED_SUFFIXES || '.vercel.app,.ngrok.app,.trycloudflare.com'
).map(s => (s.startsWith('.') ? s : `.${s}`));

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Postman/curl or same-origin without Origin header
  try {
    const u = new URL(origin);
    if (!/^https?:$/.test(u.protocol)) return false;

    // 1) Exact match (scheme + host[:port])
    if (EXACT_ORIGINS.has(u.origin)) return true;

    // 2) Wildcard suffix match on hostname
    const host = u.hostname.toLowerCase();
    return SUFFIXES.some(suf => host === suf.slice(1) || host.endsWith(suf));
  } catch {
    return false;
  }
};

const corsOptions = {
  origin(origin, cb) {
    if (isOriginAllowed(origin)) return cb(null, true);
    return cb(new Error(`CORS: Origin not allowed → ${origin}`));
  },
  // You use Bearer tokens (not cookies) → keep credentials OFF; simpler & faster CORS
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // cache preflight for 24h
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// handle preflight quickly for all routes
app.options(/.*/, cors(corsOptions));

/* ----------- Security, parsers, logging order ----------- */
// Allow cross-origin resource embedding globally (we also override for /uploads below)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan(isProd ? 'combined' : 'dev'));

/* ----------------- Static: /uploads --------------------- */
/** Make uploaded images embeddable anywhere to avoid NotSameOrigin blocks */
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    setHeaders(res /*, servedPath, stat */) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (isProd) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  })
);

/* ------------------- Health / Debug --------------------- */
app.get('/health', (_req, res) => res.json({ ok: true, env: NODE_ENV }));
app.get('/debug/cookies', (req, res) => res.json({ cookies: req.cookies || {} }));

/* ---------------------- Routes -------------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/public', publicRoutes);

/* -------------------- 404 + Errors ---------------------- */
app.use((req, res) => {
  res.status(404).json({ error: 'not_found', path: req.path });
});

app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err?.message || err);
  const status = err.status || 500;
  res.status(status).json({
    error: 'server_error',
    message: err.message || 'Unexpected error',
  });
});

/* ------------------- Start after DB --------------------- */
(async () => {
  try {
    await connectDB(); // ensure DB is up before accepting requests
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
      console.log('[CORS] Exact origins:', [...EXACT_ORIGINS].join(', ') || '(none)');
      console.log('[CORS] Suffixes:', SUFFIXES.join(', ') || '(none)');
    });
  } catch (e) {
    console.error('Failed to connect DB:', e);
    process.exit(1);
  }
})();
