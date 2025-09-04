import { Router } from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Link from "../models/Link.js";

const router = Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const HANDLE_RE = /^[a-z0-9_-]{2,30}$/;
const isHttpUrl = (u) => {
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
};

// IMPORTANT: define redirect route BEFORE /:handle
router.get("/r/:handle/:linkId", async (req, res, next) => {
  try {
    const handle = (req.params.handle || "").toLowerCase().trim();
    if (!HANDLE_RE.test(handle)) return res.status(400).send("Bad handle");
    if (!isValidObjectId(req.params.linkId)) return res.status(404).send("Not found");

    const user = await User.findOne({ handle }).select({ _id: 1, privacy: 1 }).lean();
    if (!user) return res.status(404).send("Not found");
    if (user.privacy === "private") return res.status(403).send("Profile is private");

    const link = await Link.findOne({
      _id: req.params.linkId,
      user: user._id,
      isActive: true,
    }).select({ url: 1 }).lean();

    if (!link) return res.status(404).send("Not found");
    if (!isHttpUrl(link.url)) return res.status(400).send("Invalid URL");

    // increment clicks in background; don't block redirect
    Link.updateOne({ _id: req.params.linkId }, { $inc: { clicks: 1 } })
      .catch((e) => console.error("click inc failed:", e.message));

    res.redirect(link.url);
  } catch (err) {
    next(err);
  }
});

router.get("/:handle", async (req, res, next) => {
  try {
    const handle = (req.params.handle || "").toLowerCase().trim();
    if (!HANDLE_RE.test(handle)) {
      return res.status(400).json({ error: "Invalid handle" });
    }

    // Allow-list public fields only
    const user = await User.findOne({ handle })
      .select({
        _id: 1,
        handle: 1,
        displayName: 1,
        avatarUrl: 1,
        bio: 1,
        theme: 1,
        socials: 1,
        privacy: 1,
      })
      .lean();

    if (!user) return res.status(404).json({ error: "Profile not found" });
    if (user.privacy === "private") {
      return res.status(403).json({ error: "Profile is private" });
    }

    const isUnlisted = user.privacy === "unlisted";

    const links = await Link.find({ user: user._id, isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select({ _id: 1, title: 1, url: 1, order: 1 }) // exclude user/clicks
      .lean();

    res.json({ user: { ...user, isUnlisted }, links });
  } catch (err) {
    next(err);
  }
});

export default router;
