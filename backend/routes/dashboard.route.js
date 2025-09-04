// routes/dashboard.route.js
import { Router } from "express";
import mongoose from "mongoose";
import Dashboard from "../models/Dashboard.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

/** Parse pagination/sort from query */
function parsePage(q = {}) {
  const page  = Number.isFinite(+q.page)  ? Math.max(parseInt(q.page), 1) : 1;
  const limit = Number.isFinite(+q.limit) ? Math.min(Math.max(parseInt(q.limit), 1), 100) : 20;
  const skip  = (page - 1) * limit;
  // allow "name,-createdAt", convert to "name -createdAt"
  const sort  = (q.sort || "-createdAt").split(",").join(" ");
  return { page, limit, skip, sort };
}

/* --------------------------- SUMMARY (specific) --------------------------- */
/** GET /api/dashboards/summary -> personalized summary for logged-in user */
router.get("/summary", authRequired, async (req, res, next) => {
  try {
    const owner = req.userId;

    const [dashCount, recentDash] = await Promise.all([
      Dashboard.countDocuments({ owner }),
      Dashboard.find({ owner })
        .sort("-updatedAt")
        .limit(5)
        .select("name updatedAt")
        .lean(),
    ]);

    return res.json({
      userId: owner,
      metrics: { dashboards: dashCount },
      recent: { dashboards: recentDash },
    });
  } catch (err) { next(err); }
});

/* ------------------------------ COLLECTION ------------------------------- */
/** GET /api/dashboards?search=&owner=&page=&limit=&sort= */
router.get("/", authRequired, async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePage(req.query);
    const filter = {};

    // Search by name/description
    if (req.query.search?.trim()) {
      const s = req.query.search.trim();
      filter.$or = [
        { name: new RegExp(s, "i") },
        { description: new RegExp(s, "i") },
      ];
    }

    // Scope to explicit owner if provided (and valid); otherwise current user
    if (req.query.owner) {
      if (!mongoose.isValidObjectId(req.query.owner)) {
        return res.status(400).json({ error: "invalid owner id" });
      }
      filter.owner = req.query.owner;
    } else {
      filter.owner = req.userId;
    }

    const [data, total] = await Promise.all([
      Dashboard.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Dashboard.countDocuments(filter),
    ]);

    res.json({
      data,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 0,
      hasNext: skip + data.length < total,
      hasPrev: page > 1,
    });
  } catch (err) { next(err); }
});

/** POST /api/dashboards (create) */
router.post("/", authRequired, async (req, res, next) => {
  try {
    const { name, description, layout, widgets, visibility } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const doc = await Dashboard.create({
      name,
      description: description ?? "",
      layout: layout ?? {},
      widgets: Array.isArray(widgets) ? widgets : [],
      visibility: visibility ?? "private",
      owner: req.userId, // <-- always the logged-in user
    });

    res.status(201).json(doc);
  } catch (err) { next(err); }
});

/* ---------------------------- PARAM ROUTES ------------------------------- */
/** GET /api/dashboards/:id */
router.get("/:id", authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid id" });
    }

    const doc = await Dashboard.findOne({ _id: id, owner: req.userId }).lean();
    if (!doc) return res.status(404).json({ error: "not found" });

    res.json(doc);
  } catch (err) { next(err); }
});

/** PATCH /api/dashboards/:id */
router.patch("/:id", authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid id" });
    }

    // Do not allow owner changes via update
    const { owner, ...rest } = req.body || {};
    const updates = { ...rest, updatedAt: new Date() };

    const doc = await Dashboard.findOneAndUpdate(
      { _id: id, owner: req.userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "not found" });

    res.json(doc);
  } catch (err) { next(err); }
});

/** DELETE /api/dashboards/:id */
router.delete("/:id", authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid id" });
    }

    const doc = await Dashboard.findOneAndDelete({ _id: id, owner: req.userId });
    if (!doc) return res.status(404).json({ error: "not found" });

    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
