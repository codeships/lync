// routes/auth.route.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
<<<<<<< HEAD
=======
import rateLimit from "express-rate-limit";
import validator from "validator";
>>>>>>> 18316552b2d56e74d5729faae38c2c39603c8fa5
import User from "../models/User.js";
import { signAuthToken } from "../middleware/auth.js";

const router = Router();

<<<<<<< HEAD
// ==== config ====
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const USE_AUTH_COOKIE = process.env.SET_AUTH_COOKIE === "true"; // set in env to use cookies

// ---- helpers ----
const normalizeEmail = (s = "") => s.toString().trim().toLowerCase();

// normalize to lowercase, kebab, and safe chars
const normalizeHandle = (s = "") =>
  s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
=======
// -------- Helpers --------
const normalizeHandle = (s = "") =>
  s.toString().trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");
>>>>>>> 18316552b2d56e74d5729faae38c2c39603c8fa5

// Try to make a unique handle; final safeguard is DB unique index
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

<<<<<<< HEAD
function issueToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      handle: user.handle,
      typ: "access",
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
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

// Minimal auth middleware (JWT from Authorization: Bearer <token> or cookie "token")
export async function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const bearer = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    const token = bearer || req.cookies?.token;
    if (!token) return res.status(401).json({ error: "unauthorized" });

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ error: "invalid user" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid or expired token" });
  }
}

/**
 * POST /api/auth/register
 * body: { email, password, displayName, handle? }
 * returns: { token, user }
 */
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (exists) return res.status(409).json({ error: "email already in use" });

    const user = await User.create({
      email,
      password, // pre-save will hash it
      displayName: displayName ?? "",
    });

    // Optionally auto-login after register:
    const token = signAuthToken(user._id);
    const safeUser = {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(201).json({ token, user: safeUser });
=======
// JWT helpers
const signJwt = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d", issuer: "your-app" });

const setAuthCookie = (res, token) => {
  // Consider `secure: true` in production and `sameSite: "strict"`
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// -------- Rate limiting (per-IP) --------
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50,                  // 50 attempts per 10 min
  standardHeaders: true,
  legacyHeaders: false,
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // stricter for register
  standardHeaders: true,
  legacyHeaders: false,
});

// -------- Routes --------

// REGISTER
router.post("/register", sensitiveLimiter, async (req, res, next) => {
  try {
    const { email, password, displayName, handle } = req.body;

    // Basic validations
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "email, password, and displayName are required" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    // Example password policy: min 8 chars, at least 1 letter & 1 number
    if (
      !validator.isLength(password, { min: 8 }) ||
      !( /[A-Za-z]/.test(password) && /\d/.test(password) )
    ) {
      return res.status(400).json({
        error: "Password must be at least 8 chars and include letters and numbers",
      });
    }
    if (!validator.isLength(displayName, { min: 2, max: 60 })) {
      return res.status(400).json({ error: "displayName must be 2–60 characters" });
    }

    // Resolve handle
    let finalHandle = handle ? normalizeHandle(handle) : null;
    if (!finalHandle) {
      const base = displayName || email.split("@")[0];
      finalHandle = await ensureUniqueHandle(base);
    } else {
      // quick pre-check (DB unique index will be the final arbiter)
      if (await User.exists({ handle: finalHandle })) {
        return res.status(409).json({ error: "Handle already taken" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user — rely on unique indexes for email & handle to prevent races
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      displayName,
      handle: finalHandle,
    });

    await user.save().catch((err) => {
      if (err?.code === 11000) {
        // Duplicate key — identify which field
        const field = Object.keys(err.keyPattern || {})[0] || "field";
        throw Object.assign(new Error(`${field} already in use`), { status: 409 });
      }
      throw err;
    });

    const token = signJwt({ sub: user._id.toString(), h: user.handle });
    setAuthCookie(res, token);

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        handle: user.handle,
      },
      token, // optionally omit if you only use httpOnly cookie
    });
>>>>>>> 18316552b2d56e74d5729faae38c2c39603c8fa5
  } catch (err) {
    next(err);
  }
});

<<<<<<< HEAD
/**
 * POST /api/auth/login
 * body: { email, password } OR { handle, password } (email takes precedence if both provided)
 * returns: { token, user }
 */
// routes/auth.route.js (login)
// routes/auth.route.js (login)
// routes/auth.route.js (login)
// routes/auth.route.js (login)
router.post("/login", async (req, res, next) => {
=======
// LOGIN
router.post("/login", authLimiter, async (req, res, next) => {
>>>>>>> 18316552b2d56e74d5729faae38c2c39603c8fa5
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

<<<<<<< HEAD
    const normalized = email.toLowerCase().trim();
=======
    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
>>>>>>> 18316552b2d56e74d5729faae38c2c39603c8fa5

    // IMPORTANT: select the stored hash field
    const user = await User.findOne({ email: normalized }).select("+passwordHash");

<<<<<<< HEAD
    // Optional one-time debug:
    // console.log("[AUTH] login:", normalized, "has user?", !!user, "has hash?", !!user?.passwordHash);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    // Model's comparePassword uses passwordHash internally
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: "invalid credentials" });

    const token = signAuthToken(user._id);
    const safeUser = {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      handle: user.handle,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.json({ token, user: safeUser });
=======
    const token = signJwt({ sub: user._id.toString(), h: user.handle });
    setAuthCookie(res, token);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        handle: user.handle,
      },
      token, // optionally omit if using only cookie
    });
>>>>>>> 18316552b2d56e74d5729faae38c2c39603c8fa5
  } catch (err) {
    next(err);
  }
});


/**
 * GET /api/auth/me
 * header: Authorization: Bearer <token>   OR cookie "token"
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
    res.clearCookie("token", { sameSite: "none", secure: true });
  }
  return res.json({ success: true });
});

export default router;
