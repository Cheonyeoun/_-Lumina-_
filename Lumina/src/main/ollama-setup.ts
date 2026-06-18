// src/main/ollama-setup.ts
import { spawn } from "child_process";
import fetch from "node-fetch";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import AdmZip from "adm-zip";

const OLLAMA_PORT = 11434;
const OLLAMA_URL = `http://localhost:${OLLAMA_PORT}`;
const OLLAMA_DOWNLOAD_URL =
  "https://github.com/ollama/ollama/releases/latest/download/ollama-windows-amd64.zip";
const OLLAMA_DIR = path.join(process.env.APPDATA || os.homedir(), "Lumina", "ollama");
const OLLAMA_EXE = path.join(OLLAMA_DIR, "ollama.exe");

const HEALTH_CHECK_INTERVAL = 1000;
const HEALTH_CHECK_MAX_RETRIES = 30; // 30 seconds max wait

/**
 * Checks if Ollama server is reachable with a proper timeout.
 */
async function isOllamaRunning(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`${OLLAMA_URL}/api/version`, {
      signal: controller.signal as any,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Downloads the portable Ollama zip and extracts it.
 * Uses streaming write instead of buffering entire zip in memory.
 */
async function downloadAndExtractOllama(): Promise<void> {
  console.log("[ollama-setup] Downloading Ollama...");
  const response = await fetch(OLLAMA_DOWNLOAD_URL);
  if (!response.ok) throw new Error(`Failed to download Ollama: ${response.status}`);

  // Ensure directory exists
  fs.mkdirSync(OLLAMA_DIR, { recursive: true });
  const zipPath = path.join(OLLAMA_DIR, "ollama.zip");

  // Stream to disk instead of buffering in memory
  const fileStream = fs.createWriteStream(zipPath);
  await new Promise<void>((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on("error", reject);
    fileStream.on("finish", resolve);
    fileStream.on("error", reject);
  });

  console.log("[ollama-setup] Extracting...");
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(OLLAMA_DIR, true);

  // Clean up zip
  try { fs.unlinkSync(zipPath); } catch { /* ignore */ }
  console.log("[ollama-setup] Ollama extracted to", OLLAMA_DIR);
}

/**
 * Starts Ollama serve process with retry-based health check.
 */
function startOllamaProcess(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(OLLAMA_EXE)) {
      return reject(new Error("ollama.exe not found after extraction"));
    }

    const proc = spawn(OLLAMA_EXE, ["serve"], {
      detached: true,
      stdio: "ignore",
    });
    proc.unref();

    let retries = 0;
    const check = async () => {
      if (retries >= HEALTH_CHECK_MAX_RETRIES) {
        return reject(new Error("Ollama server did not start within timeout"));
      }
      retries++;
      const alive = await isOllamaRunning();
      if (alive) {
        resolve();
      } else {
        setTimeout(check, HEALTH_CHECK_INTERVAL);
      }
    };
    setTimeout(check, HEALTH_CHECK_INTERVAL);
  });
}

/**
 * Ensures Ollama is running. Downloads, extracts, and starts it if needed.
 */
export async function ensureOllamaIsRunning(): Promise<void> {
  if (await isOllamaRunning()) {
    console.log("[ollama-setup] Ollama already running");
    return;
  }

  if (!fs.existsSync(OLLAMA_EXE)) {
    await downloadAndExtractOllama();
  }

  console.log("[ollama-setup] Starting Ollama server...");
  await startOllamaProcess();
  console.log("[ollama-setup] Ollama server is up");
}
