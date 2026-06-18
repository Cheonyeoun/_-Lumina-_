// src/main/index.ts
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import * as fs from "fs";
import { ensureOllamaIsRunning } from "./ollama-setup";
import { InputHandler } from "./input-handler";
import { ContextObserver } from "./context";
import { AICore } from "./ai-core";
import Store from "electron-store";

let mainWindow: BrowserWindow | null = null;
const store = new Store<{ fusionEnabled: boolean }>({ defaults: { fusionEnabled: false } });

// Singleton instances — created once at startup
let observer: ContextObserver;
let ai: AICore;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Lumina",
    show: false, // Don't show until ready — eliminates white flash
    backgroundColor: "#1a2332", // Match --color-bg so no flash
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Graceful show — only display when renderer is painted
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // Load the webpack-dev-server URL or the built file
  // Forge's webpack plugin sets this magic global
  const MAIN_WINDOW_WEBPACK_ENTRY = (global as any).MAIN_WINDOW_WEBPACK_ENTRY;
  if (MAIN_WINDOW_WEBPACK_ENTRY) {
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => (mainWindow = null));
}

function registerIpcHandlers() {
  // Open a project folder or file
  ipcMain.handle("open-path", async (_, inputPath: string) => {
    try {
      const normalized = await InputHandler.processInput(inputPath);
      observer.watchProject(normalized);
      return { status: "ok", path: normalized };
    } catch (err: any) {
      return { status: "error", message: err.message };
    }
  });

  // Open folder picker dialog
  ipcMain.handle("open-folder-dialog", async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const folderPath = result.filePaths[0];
    observer.watchProject(folderPath);
    return folderPath;
  });

  // List directory contents
  ipcMain.handle("list-directory", async (_, dirPath: string) => {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      return entries
        .filter((e) => !e.name.startsWith(".") && e.name !== "node_modules")
        .map((e) => ({
          name: e.name,
          path: path.join(dirPath, e.name),
          isDir: e.isDirectory(),
        }))
        .sort((a, b) => {
          // Directories first, then alphabetical
          if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
    } catch {
      return [];
    }
  });

  // Read file content
  ipcMain.handle("read-file", async (_, filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return { status: "ok", content };
    } catch (err: any) {
      return { status: "error", message: err.message };
    }
  });

  // AI query
  ipcMain.handle("generate-code", async (_, question: string) => {
    const context = observer.getContextSummary();
    const fusionEnabled = store.get("fusionEnabled");
    return await ai.query(question, context, fusionEnabled);
  });

  // Fusion toggle
  ipcMain.handle("toggle-fusion", (_, enabled: boolean) => {
    store.set("fusionEnabled", enabled);
    return { success: true };
  });

  ipcMain.handle("get-fusion-status", () => {
    return store.get("fusionEnabled");
  });
}

app.whenReady().then(async () => {
  // Initialize core services in parallel where possible
  observer = new ContextObserver();
  ai = new AICore();

  registerIpcHandlers();
  createWindow();

  // Start Ollama in background — don't block window creation
  ensureOllamaIsRunning().catch((err) => {
    console.error("Ollama setup failed:", err);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
