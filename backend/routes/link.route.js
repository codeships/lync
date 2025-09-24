// routes/links.js (ESM)
import { Router } from "express";
import mongoose from "mongoose";
import Link from "../models/Link.js";
import { authsRequired /*, optionalAuth*/ } from "../middleware/auth.js";

const router = Router();

/* ---------------------------- Helpers --------------------------- */
const MAX_TITLE_LEN = 120;
const MAX_LIMIT = 100;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const authedUserId = (req) => {
  // Expect middleware to set req.user = { id, email, role }
  return String(req.user?.id || req.userId || "");
};

const assertAuthed = (req, res) => {
  const uid = authedUserId(req);
  if (!uid) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
};

const normalizeTitle = (s = "") => s.toString().trim();

const validateUrl = (s = "") => {
  try {
    const u = new URL(String(s).trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const toInt = (v, def = 0) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
};

const beginSession = async () => {
  try {
    return await mongoose.startSession();
  } catch {
    return null;
  }
};

// Debug middleware to inspect auth state early
const debugAuth = (req, _res, next) => {
  console.log("Auth debug:", {
    hasUserId: !!req.userId,
    hasUser: !!req.user,
    userId: req.userId || req.user?.id,
    method: req.method,
    path: req.path,
    authHeader: req.headers.authorization ? "present" : "missing",
    cookies: req.cookies ? Object.keys(req.cookies) : "none",
  });

  if (!req.user && req.headers.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.slice(7);
    console.log("Extracted token (first 10):", token.substring(0, 10) + "...");
  }
  next();
};

/* ============================ ROUTES ============================ */

// Run debug, then require auth for all routes in this router
router.use(debugAuth);
router.use(authsRequired);

/** GET /me — list links (with pagination) */
router.get("/me", async (req, res, next) => {
  try {
    if (!assertAuthed(req, res)) return;
    const uid = authedUserId(req);

    const limit = Math.min(Math.max(toInt(req.query.limit, 50), 1), MAX_LIMIT);
    const skip = Math.max(toInt(req.query.skip, 0), 0);

    const q = (req.query.q || "").toString().trim();
    const filter = { user: uid };
    if (q) {
      // Escape regex specials
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: safe, $options: "i" };
    }

    const [items, total] = await Promise.all([
      Link.find(filter).sort({ order: 1, createdAt: 1 }).skip(skip).limit(limit).lean(),
      Link.countDocuments(filter),
    ]);

    res.set("Cache-Control", "no-store");
    res.json({
      data: items,
      meta: {
        total,
        limit,
        skip,
        hasMore: skip + items.length < total,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** POST /me — create single link */
router.post("/me", async (req, res, next) => {
  try {
    if (!assertAuthed(req, res)) return;
    const uid = authedUserId(req);

    const { title, url, isActive } = req.body || {};
    const t = normalizeTitle(title);

    if (!t || t.length > MAX_TITLE_LEN) {
      return res.status(400).json({ error: `title is required (max ${MAX_TITLE_LEN} chars)` });
    }
    if (!validateUrl(url)) {
      return res.status(400).json({ error: "url must be a valid http/https URL" });
    }
    if (isActive != null && typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be boolean" });
    }

    const last = await Link.findOne({ user: uid }).sort({ order: -1 }).select({ order: 1 }).lean();
    const nextOrder = (last?.order ?? -1) + 1;

    const link = await Link.create({
      user: uid,
      title: t,
      url: String(url).trim(),
      isActive: isActive ?? true,
      order: nextOrder,
    });

    res.status(201).json(link);
  } catch (err) {
    next(err);
  }
});

/** PATCH /me/:id — update a link */
router.patch("/me/:id", async (req, res, next) => {
  try {
    if (!assertAuthed(req, res)) return;
    const uid = authedUserId(req);
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const update = {};
    if ("title" in req.body) {
      const t = normalizeTitle(req.body.title);
      if (!t || t.length > MAX_TITLE_LEN) return res.status(400).json({ error: "Invalid title" });
      update.title = t;
    }
    if ("url" in req.body) {
      const u = String(req.body.url).trim();
      if (!validateUrl(u)) return res.status(400).json({ error: "Invalid url" });
      update.url = u;
    }
    if ("isActive" in req.body) {
      if (typeof req.body.isActive !== "boolean")
        return res.status(400).json({ error: "isActive must be boolean" });
      update.isActive = req.body.isActive;
    }

    if (Object.keys(update).length === 0)
      return res.status(400).json({ error: "No valid fields to update" });

    const link = await Link.findOneAndUpdate(
      { _id: id, user: uid },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!link) return res.status(404).json({ error: "Link not found" });
    res.json(link);
  } catch (err) {
    next(err);
  }
});

/** DELETE /me/:id */
router.delete("/me/:id", async (req, res, next) => {
  try {
    if (!assertAuthed(req, res)) return;
    const uid = authedUserId(req);
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const deleted = await Link.findOneAndDelete({ _id: id, user: uid });
    if (!deleted) return res.status(404).json({ error: "Link not found" });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** POST /me/reorder — reorder links in bulk
 * body: { items: [{ id, order }, ...] }
 */
router.post("/me/reorder", async (req, res, next) => {
  try {
    if (!assertAuthed(req, res)) return;
    const uid = authedUserId(req);

    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items must be a non-empty array" });
    }

    for (const it of items) {
      if (!it || !isValidObjectId(it.id) || !Number.isInteger(it.order) || it.order < 0) {
        return res.status(400).json({ error: "Each item must have valid {id, order>=0 integer}" });
      }
    }

    const ids = items.map((i) => i.id);
    const ownedCount = await Link.countDocuments({ _id: { $in: ids }, user: uid });
    if (ownedCount !== ids.length) {
      return res.status(400).json({ error: "One or more items do not belong to the user" });
    }

    const session = await beginSession();

    const run = async () => {
      const ops = items.map(({ id, order }) => ({
        updateOne: {
          filter: { _id: id, user: uid },
          update: { $set: { order } },
        },
      }));
      if (ops.length) await Link.bulkWrite(ops, { ordered: false, ...(session && { session }) });

      // Normalize to 0..n-1 to avoid duplicates/gaps
      const current = await Link.find({ user: uid }, null, session ? { session } : {})
        .sort({ order: 1, createdAt: 1 })
        .select({ _id: 1 })
        .lean();

      const normalizeOps = current.map((doc, idx) => ({
        updateOne: {
          filter: { _id: doc._id, user: uid },
          update: { $set: { order: idx } },
        },
      }));
      if (normalizeOps.length)
        await Link.bulkWrite(normalizeOps, { ordered: true, ...(session && { session }) });

      return Link.find({ user: uid }, null, session ? { session } : {})
        .sort({ order: 1, createdAt: 1 })
        .lean();
    };

    if (session) {
      let result;
      await session.withTransaction(async () => {
        result = await run();
      });
      await session.endSession();
      return res.json(result);
    } else {
      const result = await run();
      return res.json(result);
    }
  } catch (err) {
    next(err);
  }
});

/** PUT /me/bulk — replace entire list of links (atomic if possible)
 * body: { links: [{ title, url, isActive? }, ...] }
 */
router.put("/me/bulk", async (req, res, next) => {
  try {
    if (!assertAuthed(req, res)) return;
    const uid = authedUserId(req);

    const { links } = req.body || {};
    if (!Array.isArray(links)) {
      return res.status(400).json({ error: "links must be an array" });
    }

    // Validate + normalize input
    const normalized = [];
    for (const [idx, l] of links.entries()) {
      const rawTitle = (l?.title ?? l?.name ?? "").toString().trim();
      const rawUrl   = (l?.url ?? "").toString().trim();

      if (!rawTitle || rawTitle.length > MAX_TITLE_LEN) {
        return res.status(400).json({ error: `Link at index ${idx} has invalid title` });
      }

      // auto-prefix like your frontend helper does
      const safeUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      if (!validateUrl(safeUrl)) {
        return res.status(400).json({ error: `Link at index ${idx} has invalid URL` });
      }

      if (l?.isActive != null && typeof l.isActive !== "boolean") {
        return res.status(400).json({ error: `Link at index ${idx} has invalid isActive` });
      }

      normalized.push({
        user: uid,
        title: rawTitle,
        url: safeUrl.trim(),
        isActive: l.isActive !== false,
        order: idx,
      });
    }

    const session = await beginSession();

    const run = async () => {
      await Link.deleteMany({ user: uid }, session ? { session } : undefined);

      if (normalized.length) {
        await Link.insertMany(normalized, { ordered: true, ...(session && { session }) });
      }

      return Link.find({ user: uid }, null, session ? { session } : {})
        .sort({ order: 1, createdAt: 1 })
        .lean();
    };

    let result;
    if (session) {
      await session.withTransaction(async () => {
        result = await run();
      });
      await session.endSession();
    } else {
      result = await run();
    }

    res.set("Cache-Control", "no-store");
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Quick endpoint to verify auth wiring
router.get("/debug-auth", (req, res) => {
  res.json({
    authenticated: !!(req.user?.id || req.userId),
    userId: req.user?.id || req.userId || null,
    user: req.user || null,
    headers: {
      authorization: req.headers.authorization || "Not provided",
      cookieKeys: req.cookies ? Object.keys(req.cookies) : "No cookies",
    },
  });
});

export default router;
