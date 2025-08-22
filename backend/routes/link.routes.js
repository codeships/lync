import { Router } from "express";
import Link from "../models/Link.js";

const router = Router();

router.get(
    '/me',
    async (req,res) => {
        const links = await Link.find({ user: req.user._id }).sort({ order: 1, createdAt: 1 });
        res.json(links);
    }
)

router.post(
    '/me',
    async (req,res) => {
        const count = await Link.countDocuments({ user: req.user._id});
        const link = await Link.create({
            user: req.user._id,
            ...req.body,
            order: count,
        });
        res.status(201).json(link);
    }
)

router.patch(
    '/me/:id',
    async (req,res) => {
        const link = await Link.findOneAndUpdate(
            { id: req.params.id, user: req.user._id },
            req.body,
            { new: true }
        );
        if (!link) return res.status(404).json({ error: 'Link not found' });
        res.json(link);
    }
)

router.delete(
    '/me/:id',
    async (req,res) => {
        const deleted = await Link.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!deleted) return res.status(404).json({ error: "Link not found" });
        res.json({ ok: true });
    }
)

router.post(
    '/me/reorder',
    async (req,res) => {
        const bulk = req.body.items.map(({ id, order }) => ({
            updateOne: {
                filter: { _id: id, user: req.user._id },
                update: { $set: { order } },
            }
        }));
        if (bulk.length) await Link.bulkWrite(bulk);
        const links = await Link.find({ user: req.user._id }).sort({ order: 1, createdAt: 1 });
        res.json(links);
    }
)

export default router; 