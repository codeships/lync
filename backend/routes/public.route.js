import { Router } from "express";
import User from "../models/User.js";
import Link from "../models/Link.js";

const router = Router();

router.get(
    '/:handle',
    async (req,res) => {
        const user = await User.findOne({ handle: req.params.handle.toLowerCase() }).lean();
        if (!user) return res.status(404).json({ error: 'Profile not found' });

        if (user.privacy === 'unlisted') {
        // still return content; the "unlisted" logic is for discovery in your app
        }

        const links = await Link.find({ user: user._id, isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
        const { email, passwordHash, ...publicUser } = user;
        res.json({ user: publicUser, links });
    }
)

router.get(
    '/r/:handle/:linkId',
    async (req,res) => {
        const user = await User.findOne({ handle: req.params.handle.toLowerCase() }).lean();
        if (!user) return res.status(404).send('Not found');

        const link = await Link.findOne({ _id: req.params.linkId, user: user._id, isActive: true });
        if (!link) return res.status(404).send('Not found');

        // increment clicks in background (no need to block redirect)
        link.updateOne({ $inc: { clicks: 1 } }).catch(() => { /* noop */ });

        res.redirect(link.url);
    }
)

export default router;