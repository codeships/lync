import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from "path";
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

app.set('trust proxy', 1);               // needed if behind a proxy and using Secure cookies
app.disable('x-powered-by');

const parseList = (v = '') => v.split(',').map(s => s.trim()).filter(Boolean);
const allowedOrigins = parseList(process.env.ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || 'http://localhost:5173');

/* ------------------------ CORS -------------------------- */
/** Single source of truth. Make sure it matches your frontend(s). */
const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);               // Postman/curl
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 600,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Express 5: use a regexp for preflight “all paths”
app.options(/.*/, cors(corsOptions));

/* ----------- Security, parsers, logging order ----------- */
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false })); // explicit to avoid deprecation
app.use(morgan('dev'));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ------------------- Health / Debug --------------------- */
app.get('/health', (_req, res) => res.json({ ok: true, env: NODE_ENV }));
// Optional: quick check to see if cookies arrive cross-site
app.get('/debug/cookies', (req, res) => res.json({ cookies: req.cookies || {} }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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
  res.status(status).json({ error: 'server_error', message: err.message || 'Unexpected error' });
});

/* ------------------- Start after DB --------------------- */
(async () => {
  try {
    await connectDB(); // ensure DB is up before accepting requests
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
      console.log(`Allowed origins: ${allowedOrigins.join(', ') || '(none)'}`);
    });
  } catch (e) {
    console.error('Failed to connect DB:', e);
    process.exit(1);
  }
})();
