import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { handleChat } from "./aiService.js";
import { httpLogger, logger } from "./logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, ".env") });

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(httpLogger);

app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

app.post("/chat", async (req, res) => {
    const requiredKey = process.env.BOT_API_KEY;
    if (requiredKey) {
        const providedKey = req.header("x-bot-api-key");
        if (!providedKey || providedKey !== requiredKey) {
            return res.status(401).json({ reply: "Unauthorized" });
        }
    }

    const { message, context } = req.body || {};
    if (!message || typeof message !== "string") {
        return res.status(400).json({ reply: "Message is required" });
    }
    try {
        const reply = await handleChat({ message, context });
        return res.status(200).json({ reply });
    } catch (error) {
        logger.error({ err: error }, "Chat request failed");
        return res.status(500).json({ reply: "No data found" });
    }
});

app.use((err, _req, res, _next) => {
    logger.error({ err }, "Unhandled error");
    res.status(500).json({ reply: "No data found" });
});

app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
});
