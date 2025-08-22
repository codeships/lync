import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = Router();

router.post(
    '/register',
    async (req, res) => {
        const { email, password, displayName } = req.body;

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(409).json({ error: "Email already in use" });

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({
            email,
            passwordHash,
            displayName
        });

        res.status(201).json({
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName
            }
        })
    }
);

router.post(
    '/login',
    async (req, res) => {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: "Invalid Credentials" });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: "Invalid Credentails" });

        res.json({
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName
            }
        })

    }
)

export default router;