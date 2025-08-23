import cors from "cors"
import express from "express"
import helmet from "helmet"
import dotenv from "dotenv"
import morgan from "morgan"

import authRoutes from './routes/auth.route.js';
import profileRoutes from './routes/profile.route.js';
import linksRoutes from './routes/link.route.js';
import publicRoutes from './routes/public.route.js';

import { connectDB } from "./config/db.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

await connectDB();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded());
app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN?.split(',') ?? '*',
        credentials: true
    })
);

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/public', publicRoutes);

app.use(morgan('dev'));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});