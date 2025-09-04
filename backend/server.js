<<<<<<< HEAD
// server.js (ESM)
import express from "express";
import cors from "cors";
=======
import cors from "cors";
import express from "express";
>>>>>>> 18316552b2d56e74d5729faae38c2c39603c8fa5
import helmet from "helmet";
import dotenv from "dotenv";
import morgan from "morgan";

import authRoutes from "./routes/auth.route.js";
import profileRoutes from "./routes/profile.route.js";
import linksRoutes from "./routes/link.route.js";
import publicRoutes from "./routes/public.route.js";
<<<<<<< HEAD
import dashboardRoutes from "./routes/dashboard.route.js";
import { authRequired } from "./middleware/auth.js";
=======
>>>>>>> 18316552b2d56e74d5729faae38c2c39603c8fa5

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
<<<<<<< HEAD
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health
app.get("/health", (req, res) => res.send("ok"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.get("/api/auth/me", authRequired, (req, res) => {
  // If you used makeAuthRequired with a loader, you'd have req.user here.
  res.json({ userId: req.userId });
});

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

// index.js (or server.js) — put this at the very top
import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]); // Cloudflare + Google


const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
};

start();
=======
app.use(express.json());
app.use(express.urlencoded({ extended: true})); // ❌ This is missing the 'extended' option
app.use(morgan("dev")); //✅ Fix: Move this near the top, right after creating the app

//❌ This can return undefined if FRONTEND_ORIGIN is not set
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN?.split(",") ?? "*",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/public", publicRoutes);


app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
>>>>>>> 18316552b2d56e74d5729faae38c2c39603c8fa5
