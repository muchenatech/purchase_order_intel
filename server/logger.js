import pino from "pino";
import pinoHttp from "pino-http";

export const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    redact: {
        paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.body.context",
            "req.body.message",
            "OPENAI_API_KEY",
            "SAP_PASSWORD",
            "SAP_BEARER_TOKEN"
        ],
        remove: true
    }
});

export const httpLogger = pinoHttp({ logger });
