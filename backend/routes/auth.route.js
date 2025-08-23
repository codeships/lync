import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = Router();

// normalize to lowercase, kebab, and safe chars
const normalizeHandle = (s = "") =>
  s.toString().trim().toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");

// ensure uniqueness by adding a numeric suffix if needed
async function ensureUniqueHandle(base) {
  let root = normalizeHandle(base) || "user";
  let candidate = root;
  let i = 0;
  // loop until a free handle is found
  // (User.exists is efficient, uses index if you've set it)
  while (await User.exists({ handle: candidate })) {
    i += 1;
    candidate = `${root}${i}`;
  }
  return candidate;
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, displayName, handle } = req.body;

    // basic payload checks
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "email, password, and displayName are required" });
    }

    // email uniqueness
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // resolve final handle
    let finalHandle = handle ? normalizeHandle(handle) : null;
    if (!finalHandle) {
      // derive from displayName or email local-part
      const base = displayName || email.split("@")[0];
      finalHandle = await ensureUniqueHandle(base);
    } else {
      // explicit handle was provided; ensure it's not taken
      if (await User.exists({ handle: finalHandle })) {
        return res.status(409).json({ error: "Handle already taken" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      passwordHash,
      displayName,
      handle: finalHandle, // ✅ set handle
    });

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        handle: user.handle,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        handle: user.handle, // include handle for the frontend
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
