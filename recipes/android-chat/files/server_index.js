import express from "express";
import cors from "cors";
import "dotenv/config";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const input = messages
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-30)
      .map(m => ({ role: m.role, content: m.content }));

    if (input.length === 0) return res.status(400).json({ error: "messages is required" });

    const response = await client.responses.create({
      model: "gpt-5",
      reasoning: { effort: "low" },
      input
    });

    res.json({ text: response.output_text ?? "" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

const port = process.env.PORT || {{SERVER_PORT}};
app.listen(port, () => console.log(`Proxy on http://localhost:${port}`));
