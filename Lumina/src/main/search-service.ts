// src/main/search-service.ts
import fetch from "node-fetch";

interface SearchResult {
  Abstract: string;
  Answer: string;
  RelatedTopics: Array<{ Text: string; URL: string }>;
}

const SEARCH_TIMEOUT = 5000; // 5 second timeout
const DDG_API = "https://api.duckduckgo.com/";

/**
 * Perform a web search using DuckDuckGo Instant Answer API.
 * Free, no key required. Returns a simplified object for AI synthesis.
 */
export async function fetchWebResults(query: string): Promise<SearchResult | null> {
  if (!query.trim()) return null;

  const url = `${DDG_API}?q=${encodeURIComponent(query)}&format=json&no_redirect=1&skip_disambig=1`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal as any });
    if (!response.ok) return null;

    const data = await response.json();

    // Only return if we got meaningful content
    const hasContent = data.Abstract || data.Answer || (data.RelatedTopics?.length > 0);
    if (!hasContent) return null;

    return {
      Abstract: data.Abstract || "",
      Answer: data.Answer || "",
      RelatedTopics: (data.RelatedTopics || [])
        .filter((t: any) => t.Text && t.FirstURL)
        .slice(0, 5)
        .map((t: any) => ({ Text: t.Text, URL: t.FirstURL })),
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.warn("[search-service] Search timed out for query:", query);
    } else {
      console.error("[search-service] Search failed:", err.message);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
