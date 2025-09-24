// routes/profile.route.js (ESM)
import { Router } from "express";
import mongoose from "mongoose";
import multer from "multer";
import fs from "fs";
import path from "path";
import User from "../models/User.js";
import { authsRequired } from "../middleware/auth.js";

const router = Router();
const isOid = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

router.use(authsRequired);

/* ---------- Multer storage for avatars ---------- */
const AVATAR_DIR = path.join(process.cwd(), "uploads", "avatars");
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp|gif|avif)$/i.test(file.mimetype);
    cb(ok ? null : new Error("Only image files are allowed"), ok);
  },
});

/* ---------- POST /api/profile/avatar ---------- */
// field name must be "avatar"
router.post("/avatar", upload.single("avatar"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "avatar file is required" });

    const filename = req.file.filename;
    const publicBase = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const avatarPath = `/uploads/avatars/${filename}`;
    const avatarUrl = `${publicBase}${avatarPath}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { avatarUrl } },
      { new: true, upsert: false }
    ).lean();

    res.status(201).json({ avatarUrl: user?.avatarUrl || avatarUrl });
  } catch (e) {
    next(e);
  }
});

/* ---------- Existing GET/PATCH (keep yours) ---------- */
router.get("/me", async (req, res, next) => {
  try {
    const q = isOid(req.user?.id) ? { _id: req.user.id } : { email: req.user.email };
    const setOnInsert = { email: req.user.email };

    const user = await User.findOneAndUpdate(q, { $setOnInsert: setOnInsert }, { new: true, upsert: true }).lean();

    res.json({
      id: String(user._id),
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      avatarUrl: user.avatarUrl || "",
      handle: user.handle || "",
      bio: user.bio || "",
    });
  } catch (e) { next(e); }
});

router.patch("/me", async (req, res, next) => {
  try {
    const q = isOid(req.user?.id) ? { _id: req.user.id } : { email: req.user.email };
    const updates = {};
    if (typeof req.body.firstName === "string") updates.firstName = req.body.firstName.trim();
    if (typeof req.body.lastName === "string")  updates.lastName  = req.body.lastName.trim();
    if (typeof req.body.bio === "string")       updates.bio       = req.body.bio.trim();

    if (typeof req.body.handle === "string") {
      const h = req.body.handle.trim().toLowerCase();
      if (!/^[a-z0-9_.]{3,30}$/.test(h))
        return res.status(400).json({ error: "Handle must be 3-30 chars: a-z 0-9 _ ." });
      const reserved = new Set(["admin","api","public","profile","links","login","register","me","about","dashboard"]);
      const taken = await User.findOne({ handle: h, _id: { $ne: q._id } }).lean();
      if (reserved.has(h)) return res.status(400).json({ error: "Handle is reserved" });
      if (taken) return res.status(409).json({ error: "Handle already taken" });
      updates.handle = h;
    }

    const user = await User.findOneAndUpdate(
      q,
      { $set: updates, $setOnInsert: { email: req.user.email } },
      { new: true, upsert: true }
    ).lean();

    res.json({
      id: String(user._id),
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      avatarUrl: user.avatarUrl || "",
      handle: user.handle || "",
      bio: user.bio || "",
    });
  } catch (e) { next(e); }
});

export default router;
