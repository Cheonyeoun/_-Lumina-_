// src/main/ai-core.ts
import fetch from "node-fetch";
import * as fs from "fs";
import * as path from "path";
import { fetchWebResults } from "./search-service";

const OLLAMA_API = "http://localhost:11434/api/chat";

export class AICore {
  private systemPrompt: string;
  private model: string = "llama3.2";

  constructor() {
    // Resolve prompt path relative to the compiled output
    const promptPath = path.resolve(__dirname, "../../src/prompts/system.txt");
    try {
      this.systemPrompt = fs.readFileSync(promptPath, "utf-8");
    } catch {
      // Fallback: try relative to __dirname directly
      const fallback = path.resolve(__dirname, "../prompts/system.txt");
      try {
        this.systemPrompt = fs.readFileSync(fallback, "utf-8");
      } catch {
        console.warn("[ai-core] System prompt not found, using default");
        this.systemPrompt = "You are a helpful coding assistant.";
      }
    }
  }

  /**
   * Query the local Ollama model.
   * @param question User question.
   * @param context Summary of project files.
   * @param fusionEnabled Whether to fetch web data and synthesize.
   */
  async query(question: string, context: string, fusionEnabled: boolean): Promise<string> {
    // Run web search in parallel with prompt construction if fusion is on
    let webData: any = null;
    if (fusionEnabled) {
      const safeQuery = this.sanitizeQuery(question);
      try {
        webData = await fetchWebResults(safeQuery);
      } catch (err) {
        console.warn("[ai-core] Fusion search failed, continuing without:", err);
      }
    }

    // Build a focused context — limit token waste
    const trimmedContext = context.length > 4000
      ? context.slice(0, 4000) + "\n... (truncated)"
      : context;

    const userContent = [
      `PROJECT CONTEXT:\n${trimmedContext}`,
      `\nQUESTION:\n${question}`,
      webData ? `\nWEB RESULTS (SYNTHESIZE, DO NOT JUST LIST):\n${JSON.stringify(webData, null, 2)}` : "",
    ].filter(Boolean).join("\n");

    const messages = [
      { role: "system" as const, content: this.systemPrompt },
      { role: "user" as const, content: userContent },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000); // 2 min timeout

    try {
      const response = await fetch(OLLAMA_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, messages, stream: false }),
        signal: controller.signal as any,
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Ollama request failed: ${response.status} ${txt}`);
      }

      const data = await response.json();
      return data.message?.content ?? "";
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Strip file paths, variable names, and potential sensitive identifiers
   * to protect privacy before sending to web search.
   */
  private sanitizeQuery(question: string): string {
    return question
      // Remove Windows/Unix file paths
      .replace(/([a-zA-Z]:\\|\/)[^\s'"]+/g, "[path]")
      // Remove camelCase/PascalCase identifiers that look like code
      .replace(/\b[a-z]+(?:[A-Z][a-z]*){2,}\b/g, "[identifier]")
      // Remove quoted strings (potential code/secrets)
      .replace(/"[^"]{20,}"/g, '"[redacted]"')
      .replace(/'[^']{20,}'/g, "'[redacted]'")
      .trim();
  }
}
