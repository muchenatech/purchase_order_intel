import OpenAI from "openai";
import { getPurchaseOrderDetails, getVendorDetails, getPurchaseOrders } from "./sapService.js";
import { logger } from "./logger.js";

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const SYSTEM_PROMPT = `You are an SAP AI assistant embedded in a Purchase Order screen.

You are given UI context with SAP data.

STRICT RULES:

* NEVER make up SAP data
* FIRST use provided context
* ONLY call functions if needed
* If no data found, say 'No data found'
* If unclear, ask a clarification question

Be concise and accurate.`;

const tools = [
    {
        type: "function",
        function: {
            name: "getPurchaseOrderDetails",
            description: "Fetch purchase order details from SAP",
            parameters: {
                type: "object",
                properties: {
                    poNumber: { type: "string", description: "Purchase order number" }
                },
                required: ["poNumber"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getVendorDetails",
            description: "Fetch vendor details from SAP",
            parameters: {
                type: "object",
                properties: {
                    vendor: { type: "string", description: "Vendor ID" }
                },
                required: ["vendor"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getPurchaseOrders",
            description: "Fetch purchase orders from SAP using optional filters",
            parameters: {
                type: "object",
                properties: {
                    vendor: { type: "string" },
                    status: { type: "string" },
                    dateFrom: { type: "string", description: "ISO date string" },
                    dateTo: { type: "string", description: "ISO date string" },
                    top: { type: "number", description: "Maximum number of records to return" }
                }
            }
        }
    }
];

function safeJsonParse(value) {
    try {
        return JSON.parse(value || "{}");
    } catch (error) {
        return {};
    }
}

function buildContextMessage(context) {
    if (!context) {
        return "UI Context: {}";
    }
    return `UI Context: ${JSON.stringify(context)}`;
}

async function runToolCall(toolCall) {
    const args = safeJsonParse(toolCall.function.arguments);
    switch (toolCall.function.name) {
        case "getPurchaseOrderDetails":
            return getPurchaseOrderDetails(args);
        case "getVendorDetails":
            return getVendorDetails(args);
        case "getPurchaseOrders":
            return getPurchaseOrders(args);
        default:
            throw new Error("Unknown function");
    }
}

export async function handleChat({ message, context }) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured");
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildContextMessage(context) },
        { role: "user", content: message }
    ];

    const response = await client.chat.completions.create({
        model: OPENAI_MODEL,
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.2
    });

    const firstChoice = response.choices && response.choices[0];
    const toolCalls = firstChoice && firstChoice.message && firstChoice.message.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
            try {
                const result = await runToolCall(toolCall);
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result || {})
                });
            } catch (error) {
                logger.warn({ err: error }, "Tool execution failed");
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify({ error: "No data found" })
                });
            }
        }

        const finalResponse = await client.chat.completions.create({
            model: OPENAI_MODEL,
            messages,
            temperature: 0.2
        });

        const finalChoice = finalResponse.choices && finalResponse.choices[0];
        return finalChoice && finalChoice.message && finalChoice.message.content
            ? finalChoice.message.content
            : "No data found";
    }

    return firstChoice && firstChoice.message && firstChoice.message.content
        ? firstChoice.message.content
        : "No data found";
}
