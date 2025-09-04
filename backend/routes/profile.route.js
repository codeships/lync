import { Router } from "express";
import validator from "validator";
import User from "../models/User.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

const FORBIDDEN_FIELDS = new Set([
  "_id", "email", "handle", "role", "passwordHash", "createdAt", "updatedAt"
]);
const SOCIAL_KEYS = new Set([
  "twitter", "facebook", "instagram", "github", "website", "linkedin", "youtube", "tiktok"
]);

const toStr = (v) => (v ?? "").toString().trim();
const isHttpUrl = (u) =>
  validator.isURL(u, { require_protocol: true, protocols: ["http", "https"] });

router.get("/me", authRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    next(err); // graceful DB error handling
  }
});

router.put("/me", authRequired, async (req, res, next) => {
  try {
    const body = req.body || {};

    // Block protected fields early
    for (const k of Object.keys(body)) {
      if (FORBIDDEN_FIELDS.has(k)) {
        return res.status(403).json({ error: `Field '${k}' cannot be updated` });
      }
    }

    const updates = {};

    if ("displayName" in body) {
      const dn = toStr(body.displayName);
      if (!validator.isLength(dn, { min: 2, max: 60 }))
        return res.status(400).json({ error: "displayName must be 2–60 characters" });
      updates.displayName = dn;
    }

    if ("bio" in body) {
      const bio = toStr(body.bio);
      if (!validator.isLength(bio, { max: 500 }))
        return res.status(400).json({ error: "bio must be ≤ 500 characters" });
      updates.bio = bio;
    }

    if ("avatarUrl" in body) {
      const url = toStr(body.avatarUrl);
      if (!isHttpUrl(url))
        return res.status(400).json({ error: "avatarUrl must be a valid http/https URL" });
      updates.avatarUrl = url;
    }

    if ("theme" in body) {
      const theme = toStr(body.theme);
      if (!["light", "dark", "system"].includes(theme))
        return res.status(400).json({ error: "theme must be 'light' | 'dark' | 'system'" });
      updates.theme = theme;
    }

    if ("socials" in body) {
      const cleaned = {};
      const socials = body.socials || {};
      for (const [k, v] of Object.entries(socials)) {
        if (!SOCIAL_KEYS.has(k) || v == null) continue;
        let val = toStr(v);
        // Accept either full URLs or handles (convert common handles to URLs)
        if (isHttpUrl(val)) {
          cleaned[k] = val;
        } else {
          if (k === "website") {
            const withProto = val.startsWith("http") ? val : `https://${val}`;
            if (!isHttpUrl(withProto)) return res.status(400).json({ error: `Invalid website URL` });
            cleaned[k] = withProto;
          } else {
            val = val.replace(/^@/, "");
            const bases = {
              twitter: "https://x.com/",
              instagram: "https://instagram.com/",
              github: "https://github.com/",
              tiktok: "https://tiktok.com/@",
            };
            if (bases[k]) {
              cleaned[k] = bases[k] + val;
            } else {
              return res.status(400).json({ error: `Invalid ${k} URL/handle` });
            }
          }
        }
      }
      updates.socials = cleaned;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "Duplicate key conflict" });
    }
    next(err);
  }
});

export default router;
