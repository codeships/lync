// routes/public.route.js
import { Router } from "express";
import User from "../models/User.js";
import Link from "../models/Link.js";

const router = Router();

/** GET /api/public/:handle — public profile + ACTIVE links */
router.get("/:handle", async (req, res, next) => {
  try {
    const handle = String(req.params.handle || "").trim().toLowerCase();
    if (!handle) return res.status(400).json({ error: "handle_required" });

    const user = await User.findOne({ handle }).lean();
    if (!user) return res.status(404).json({ error: "user_not_found" });

    const links = await Link.find({ user: user._id, isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select({ _id: 1, title: 1, url: 1, isActive: 1, order: 1 })
      .lean();

    res.set("Cache-Control", "no-store");
    res.json({
      id: String(user._id),
      handle: user.handle || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || "",
      links, // <-- important
      meta: { linksCount: links.length },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
