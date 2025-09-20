// routes/auth.route.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import validator from "validator";
import User from "../models/User.js";

const router = Router();

/* ========= Config ========= */
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const USE_AUTH_COOKIE = process.env.SET_AUTH_COOKIE === "true"; // controls cookie vs token-in-body
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "token";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/* ========= Helpers ========= */
const normalizeEmail = (s = "") => s.toString().trim().toLowerCase();

// normalize to lowercase, kebab, and safe chars
const normalizeHandle = (s = "") =>
  s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");

async function ensureUniqueHandle(base) {
  const root = normalizeHandle(base) || "user";
  let candidate = root;
  let i = 0;
  while (await User.exists({ handle: candidate })) {
    i += 1;
    candidate = `${root}${i}`;
  }
  return candidate;
}

function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: "your-app",
  });
}

function setAuthCookie(res, token) {
  if (!USE_AUTH_COOKIE) return;
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // in local dev over http, this will be false
    sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax", // use "none" only if truly cross-site with HTTPS
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

function safeUser(u) {
  return {
    id: u._id,
    email: u.email,
    displayName: u.displayName,
    handle: u.handle,
    role: u.role,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

/* ======== Minimal auth middleware ======== */
/* Accepts Authorization: Bearer <token> or cookie "token" */
export async function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const bearer = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    const token = bearer || req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "unauthorized" });

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ error: "invalid user" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "invalid or expired token" });
  }
}

/* ========= Rate limiting ========= */
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // stricter for register
  standardHeaders: true,
  legacyHeaders: false,
});

/* ========= Routes ========= */
/**
 * POST /api/auth/register
 * body: { email, password, displayName, handle? }
 * returns: { token?, user }
 */
router.post("/register", sensitiveLimiter, async (req, res, next) => {
  try {
    const { email, password, displayName, handle } = req.body || {};

    // Basic validations
    if (!email || !password || !displayName) {
      return res
        .status(400)
        .json({ error: "email, password, and displayName are required" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "invalid email format" });
    }
    if (
      !validator.isLength(password, { min: 8 }) ||
      !(/[A-Za-z]/.test(password) && /\d/.test(password))
    ) {
      return res.status(400).json({
        error:
          "password must be at least 8 chars and include letters and numbers",
      });
    }
    if (!validator.isLength(displayName, { min: 2, max: 60 })) {
      return res
        .status(400)
        .json({ error: "displayName must be 2–60 characters" });
    }

    // Resolve unique handle
    let finalHandle = handle ? normalizeHandle(handle) : null;
    if (!finalHandle) {
      const base = displayName || email.split("@")[0];
      finalHandle = await ensureUniqueHandle(base);
    } else if (await User.exists({ handle: finalHandle })) {
      return res.status(409).json({ error: "handle already taken" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user (ensure unique indexes on email & handle in the schema)
    const user = new User({
      email: normalizeEmail(email),
      passwordHash,
      displayName,
      handle: finalHandle,
    });

    await user.save().catch((err) => {
      if (err?.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "field";
        const e = new Error(`${field} already in use`);
        e.status = 409;
        throw e;
      }
      throw err;
    });

    const token = signJwt({
      sub: user._id.toString(),
      h: user.handle,
      typ: "access",
    });
    setAuthCookie(res, token);

    return res.status(201).json({
      user: safeUser(user),
      token: USE_AUTH_COOKIE ? undefined : token, // omit token if using httpOnly cookie
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * body: { email, password } OR { handle, password }
 * returns: { token?, user }
 */
router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, handle, password } = req.body || {};
    if ((!email && !handle) || !password) {
      return res.status(400).json({ error: "email/handle and password required" });
    }

    const query = email
      ? { email: normalizeEmail(email) }
      : { handle: normalizeHandle(handle) };

    // Need the hash for comparison
    const user = await User.findOne(query).select("+passwordHash");
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const ok = user.comparePassword
      ? await user.comparePassword(password)
      : await bcrypt.compare(password, user.passwordHash);

    if (!ok) return res.status(401).json({ error: "invalid credentials" });

    const token = signJwt({
      sub: user._id.toString(),
      h: user.handle,
      typ: "access",
    });

    // Use the same single path for cookie auth
    setAuthCookie(res, token);

    return res.json({
      user: safeUser(user),
      token: USE_AUTH_COOKIE ? undefined : token,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * header: Authorization: Bearer <token> OR cookie "token"
 * returns: { user }
 */
router.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: safeUser(req.user) });
});

/**
 * POST /api/auth/logout
 * If using cookie-based auth, clear the cookie.
 */
router.post("/logout", (req, res) => {
  if (USE_AUTH_COOKIE) {
    clearAuthCookie(res);
  }
  return res.json({ success: true });
});

export default router;
