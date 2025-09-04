import { Router } from "express";
import mongoose from "mongoose";
import Link from "../models/Link.js";

const router = Router();

// --- helpers ---
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const assertAuthed = (req, res) => {
  if (!req.user?._id) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
};
const normalizeTitle = (s = "") => s.toString().trim();
const validateUrl = (s = "") => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

// GET /me — list links (with optional pagination)
router.get("/me", async (req, res, next) => {
  try {
    if (!assertAuthed(req, res)) return;

    const limit = Math.min(Math.max(parseInt(req.query.limit || "100", 10), 1), 100);
    const skip = Math.max(parseInt(req.query.skip || "0", 10), 0);

    const links = await Link.find({ user: req.user._id })
      .sort({ order: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(links);
  } catch (err) {
    next(err);
  }
});

// POST /me — create link
router.post("/me", async (req, res, next) => {
  try {
    if (!assertAuthed(req, res)) return;

    const { title, url, isActive } = req.body || {};

    // basic validation
    const t = normalizeTitle(title);
    if (!t || t.length > 120) {
      return res.status(400).json({ error: "title is required (max 120 chars)" });
    }
    if (!validateUrl(url)) {
      return res.status(400).json({ error: "url must be a valid http/https URL" });
    }
    if (isActive != null && typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be boolean" });
    }

    // pick next order (max+1 to keep stability)
    const last = await Link.findOne({ user: req.user._id })
      .sort({ order: -1 })
      .select({ order: 1 })
      .lean();
    const nextOrder = (last?.order ?? -1) + 1;

    const link = await Link.create({
      user: req.user._id,
      title: t,
      url,
      isActive: isActive ?? true,
      order: nextOrder,
    });

    res.status(201).json(link);
  } catch (err) {
    next(err);
  }
});

// PATCH /me/:id — update link (whitelist fields)
router.patch("/me/:id", async (req, res, next) => {
  try {
    if (!assertAuthed(req, res)) return;
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const update = {};
    if ("title" in req.body) {
      const t = normalizeTitle(req.body.title);
      if (!t || t.length > 120) return res.status(400).json({ error: "Invalid title" });
      update.title = t;
    }
    if ("url" in req.body) {
      if (!validateUrl(req.body.url)) return res.status(400).json({ error: "Invalid url" });
      update.url = req.body.url;
    }
    if ("isActive" in req.body) {
      if (typeof req.body.isActive !== "boolean")
        return res.status(400).json({ error: "isActive must be boolean" });
      update.isActive = req.body.isActive;
    }
    // order should be changed via /me/reorder only; ignore if present
    // never allow user/clicks changes from client
    if (Object.keys(update).length === 0)
      return res.status(400).json({ error: "No valid fields to update" });

    const link = await Link.findOneAndUpdate(
      { _id: id, user: req.user._id },           // ✅ fixed _id filter
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!link) return res.status(404).json({ error: "Link not found" });
    res.json(link);
  } catch (err) {
    next(err);
  }
});

// DELETE /me/:id
router.delete("/me/:id", async (req, res, next) => {
  try {
    if (!assertAuthed(req, res)) return;
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const deleted = await Link.findOneAndDelete({ _id: id, user: req.user._id });
    if (!deleted) return res.status(404).json({ error: "Link not found" });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /me/reorder — reorder links in bulk
router.post("/me/reorder/:id", async (req, res, next) => {
  try {
    if (!assertAuthed(req, res)) return;

    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items must be a non-empty array" });
    }

    for (const it of items) {
      if (!it || !isValidObjectId(it.id) || typeof it.order !== "number" || it.order < 0) {
        return res.status(400).json({ error: "Each item must have valid {id, order>=0}" });
      }
    }

    const bulk = items.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id, user: req.user._id },
        update: { $set: { order } },
      },
    }));

    if (bulk.length) await Link.bulkWrite(bulk, { ordered: false });

    const links = await Link.find({ user: req.user._id })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json(links);
  } catch (err) {
    next(err);
  }
});

export default router;
