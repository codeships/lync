import cors from "cors"
import express from "express"
import helmet from "helmet"
import dotenv from "dotenv"
import morgan from "morgan"

import authRoutes from './routes/auth.route.js';
import profileRoutes from './routes/profile.route.js';
import linksRoutes from './routes/link.route.js';
import publicRoutes from './routes/public.route.js';

import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.set("trust proxy", 1);
app.disable("x-powered-by");

const parseList = (v = "") => v.split(",").map(s => s.trim()).filter(Boolean);
const allowed = parseList(process.env.ALLOWED_ORIGINS);

// CORS (single source of truth)
// const corsOptions = {
//   origin(origin, cb) {
//     if (!origin) return cb(null, true);              // curl/Postman
//     if (allowed.includes(origin)) return cb(null, true);
//     return cb(null, false);                           // not allowed
//   },
//   credentials: true,
//   methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
//   allowedHeaders: ["Content-Type","Authorization"],
//   exposedHeaders: ["Content-Length","X-Request-Id"],
//   maxAge: 600,
//   optionsSuccessStatus: 204,
// };

app.use(cors({ origin: ["http://localhost:5173","http://127.0.0.1:5500"], credentials: true }));

// Express 5: use RegExp instead of "*" to avoid path-to-regexp error
app.options(/.*/, cors());

// Security, parsers, logging
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded());
app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN?.split(',') ?? '*',
        credentials: true
    })
);

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/public', publicRoutes);

app.use(morgan('dev'));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});