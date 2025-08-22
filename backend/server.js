import cors from "cors"
import express from "express"
import helmet from "helmet"
import dotenv from "dotenv"
import morgan from "morgan"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded());
app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN?.split(',') ?? '*',
        credentials: true
    })
);

app.use(morgan('dev'));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});