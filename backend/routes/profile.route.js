import { Router } from "express";
import User from "../models/User.js";

const router = Router();

router.get(
    '/me',
    async (req,res) => {
        const user = await User.findById(req.user._id).select('-passwordHash');
        res.json(user);
    }
);

router.put(
    '/me',
    async (req, res) => {
        const updates = req.body;
        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
        }).select('-passwordHash');
        res.json(user);
    }
);

export default router;