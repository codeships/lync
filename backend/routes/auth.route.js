// routes/auth.route.js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { signAuthToken } from "../middleware/auth.js";

const router = Router();

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

// ensure uniqueness by adding a numeric suffix if needed
async function ensureUniqueHandle(base) {
  let root = normalizeHandle(base) || "user";
  let candidate = root;
  let i = 0;
  while (await User.exists({ handle: candidate })) {
    i += 1;
    candidate = `${root}${i}`;
  }
  return candidate;
}

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
  } catch (err) {
    next(err);
  }
});

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
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    const normalized = email.toLowerCase().trim();

    // IMPORTANT: select the stored hash field
    const user = await User.findOne({ email: normalized }).select("+passwordHash");

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
