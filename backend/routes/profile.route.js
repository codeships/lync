// routes/profile.js
import { Router } from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Link from "../models/Link.js";              // <-- add
import { authsRequired } from "../middleware/auth.js";

const router = Router();
const isOid = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

router.use(authsRequired);

/** helper: shape + include links */
const profileWithLinks = async (userDoc) => {
  const userId = String(userDoc._id);

  const links = await Link.find({ user: userId })
    .sort({ order: 1, createdAt: 1 })
    .select({ _id: 1, title: 1, url: 1, isActive: 1, order: 1, createdAt: 1, updatedAt: 1 })
    .lean();

  return {
    id: userId,
    email: userDoc.email,
    firstName: userDoc.firstName || "",
    lastName: userDoc.lastName || "",
    avatarUrl: userDoc.avatarUrl || "",
    handle: userDoc.handle || "",
    bio: userDoc.bio || "",
    links,                           // <-- include links
    meta: {
      linksCount: links.length,      // optional convenience
    },
  };
};

/** GET /api/profile/me */
router.get("/me", async (req, res, next) => {
  try {
    const q = isOid(req.user?.id) ? { _id: req.user.id } : { email: req.user.email };
    const setOnInsert = { email: req.user.email };

    const user = await User.findOneAndUpdate(
      q,
      { $setOnInsert: setOnInsert },
      { new: true, upsert: true }
    ).lean();

    const payload = await profileWithLinks(user);
    res.set("Cache-Control", "no-store");
    res.json(payload);
  } catch (e) { next(e); }
});

/** PATCH /api/profile/me */
router.patch("/me", async (req, res, next) => {
  try {
    const q = isOid(req.user?.id) ? { _id: req.user.id } : { email: req.user.email };

    const updates = {};
    if (typeof req.body.firstName === "string") updates.firstName = req.body.firstName.trim();
    if (typeof req.body.lastName === "string")  updates.lastName  = req.body.lastName.trim();
    if (typeof req.body.bio === "string")       updates.bio       = req.body.bio.trim();

    // optional: set a public handle
    if (typeof req.body.handle === "string") {
      const h = req.body.handle.trim().toLowerCase();
      if (!/^[a-z0-9_.]{3,30}$/.test(h))
        return res.status(400).json({ error: "Handle must be 3-30 chars: a-z 0-9 _ ." });

      const reserved = new Set(["admin","api","public","profile","links","login","register","me","about","dashboard"]);
      if (reserved.has(h)) return res.status(400).json({ error: "Handle is reserved" });

      const taken = await User.findOne({ handle: h, ...("_id" in q ? { _id: { $ne: q._id } } : {}) }).lean();
      if (taken) return res.status(409).json({ error: "Handle already taken" });
      updates.handle = h;
    }

    const user = await User.findOneAndUpdate(
      q,
      { $set: updates, $setOnInsert: { email: req.user.email } },
      { new: true, upsert: true }
    );

    const payload = await profileWithLinks(user);
    res.set("Cache-Control", "no-store");
    res.json(payload);
  } catch (e) { next(e); }
});

export default router;
