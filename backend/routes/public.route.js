// routes/public.js
import { Router } from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Link from "../models/Link.js";

const router = Router();
const isOid = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

/** GET /api/public/:handleOrId */
router.get("/:handleOrId", async (req, res, next) => {
  try {
    const key = String(req.params.handleOrId || "").trim().toLowerCase();
    if (!key) return res.status(400).json({ error: "Invalid parameter" });

    const user = await (isOid(key)
      ? User.findById(key).select({ _id:1, handle:1, firstName:1, lastName:1, avatarUrl:1, bio:1 }).lean()
      : User.findOne({ handle: key }).select({ _id:1, handle:1, firstName:1, lastName:1, avatarUrl:1, bio:1 }).lean()
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    // IMPORTANT: make sure Link.user type matches (ObjectId vs string)
    const links = await Link.find({ user: user._id, isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select({ title:1, url:1, isActive:1, order:1 })
      .lean();

    res.json({
      profile: {
        id: String(user._id),
        handle: user.handle || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        fullName: [user.firstName, user.lastName].filter(Boolean).join(" "),
        avatarUrl: user.avatarUrl || "",
        bio: user.bio || "",
      },
      links,
    });
  } catch (e) { next(e); }
});

export default router;
