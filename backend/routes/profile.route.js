import { Router } from "express";
import User from "../models/User.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/me", authRequired, async (req, res) => {
  const user = await User.findById(req.user._id).select("-passwordHash");
  res.json(user);
});

router.put("/me", authRequired, async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select("-passwordHash");
  res.json(user);
});

export default router;
