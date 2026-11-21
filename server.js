import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public")));

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.get("/api/status", (_req, res) => {
  res.json({ connected: Boolean(client) });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({
        error: "JOJO is not connected yet. Add an API key to the server's .env file."
      });
    }

    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
    const safeMessages = messages
      .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
      .slice(-12)
      .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

    if (!safeMessages.length || safeMessages.at(-1).role !== "user") {
      return res.status(400).json({ error: "Send a message to start chatting." });
    }

    const response = await client.responses.create({
      model: "gpt-6.2-sol",
      instructions: "You are JOJO AI, a helpful, clear, creative assistant. Your tagline is 'A new way to think.' Be friendly and thoughtful, explain things simply when useful, and never claim to be human. Follow age-appropriate safety guidelines.",
      input: safeMessages
    });

    res.json({ reply: response.output_text || "I couldn't form a reply. Try again." });
  } catch (error) {
    console.error("JOJO API error:", error?.message || error);
    res.status(500).json({ error: "JOJO couldn't answer right now. Please try again." });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`JOJO AI running on http://localhost:${port}`));
