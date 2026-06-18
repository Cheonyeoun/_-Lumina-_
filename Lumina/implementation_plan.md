# Lumina Desktop Application

## Goal Description

Build **Lumina**, a Windows desktop application (Electron + React + TypeScript) that provides a semantic AI code editor with:
- Implicit understanding of project structure (detect .pbix/.pbip, infer dashboard context)
- Privacy‑first local AI using Ollama (llama3.2 or configured model)
- Optional Fusion Search that synthesizes web results with local context
- Dark‑theme, three‑pane UI (File tree, Monaco editor, Chat panel)
- Automatic download and startup of Ollama on first run, without user interaction
- Windows `.exe` installer built via `electron-forge` (Squirrel maker)

## User Review Required

> [!IMPORTANT]
> Please review the following decisions and provide feedback:
> - **Fusion Search implementation**: whether to use a real web‑search API (e.g., Bing) or a mock placeholder.
> - **Installer preferences**: Squirrel is default, but you may prefer NSIS or another maker.
> - **Data directory**: Ollama binaries will be stored under `%APPDATA%/Lumina/ollama`. Confirm if this location is acceptable.
> - **UI color palette**: A dark theme with primary accent `hsl(210, 60%, 55%)`. Let us know if you want a different palette.

## Open Questions

> [!WARNING]
> - **Do you want the app name and displayed product name to be exactly "Lumina"?**
> - **Should the Fusion Search toggle be persisted across sessions?**
> - **Do you have an API key for a web‑search service, or should we implement a mock fetch?**
> - **Any additional Electron security hardening settings (e.g., contextIsolation, sandbox) you require?**

## Proposed Changes

---
### Project Root

#### [NEW] package.json
- Define scripts, dependencies, and electron‑forge configuration.

#### [NEW] tsconfig.json
- TypeScript compiler settings for both main and renderer.

#### [NEW] forge.config.js
- Electron‑forge configuration with makers (Squirrel Windows) and Webpack/TypeScript support.

---
### src/main

#### [NEW] index.ts
- Create BrowserWindow, load renderer, call `ensureOllamaIsRunning()` on startup, set up IPC handlers (`generate-code`, `scan-files`, `toggle-search`).

#### [NEW] ollama-setup.ts
- Functions to check if `http://localhost:11434` is reachable.
- If not, download latest Windows portable Ollama zip from GitHub releases, extract to `%APPDATA%/Lumina/ollama`, and spawn `ollama serve` via `child_process.spawn`.
- Manage process lifecycle (restart on crash, graceful shutdown).

#### [NEW] ai-core.ts
- Wrap calls to `http://localhost:11434/api/chat`.
- `query(question, context, fusionEnabled)` builds prompt with system prompt from `src/prompts/system.txt` and optionally merges web search results.
- Implements `sanitizeQuery` to protect privacy.

#### [NEW] context.ts
- Recursive file scan (excluding `node_modules`, `dist`).
- Build lightweight context map (file type, imports) and expose `getContextSummary()`.

#### [NEW] input-handler.ts
- Detect folder vs `.pbix` vs `.pbip` as described.
- Use `adm-zip` to unzip `.pbix` to a temp directory (`os.tmpdir()`), then return path.

#### [NEW] search-service.ts
- Simple wrapper that, when Fusion enabled, calls external web‑search API (placeholder) and returns JSON results.

---
### src/renderer

#### [NEW] App.tsx
- Layout with three panes using CSS Grid/Flex.
- Provide `ProjectContext` via React Context.
- Include Fusion toggle switch in chat toolbar.

#### [NEW] Editor.tsx
- Monaco editor wrapper (`@monaco-editor/react`).
- Sync file changes with main process via IPC.

#### [NEW] Chat.tsx
- Chat UI component for user to ask AI questions.
- Sends `generate-code` IPC with question, current context, and fusion flag.

#### [NEW] FileTree.tsx
- Displays project directory tree, allows opening files.

---
### src/prompts

#### [NEW] system.txt
- The system prompt provided in the request (copy verbatim).

---
### Scripts

- `npm run start` – launches Electron in dev mode.
- `npm run make` – builds Windows installer (`.exe`).

## Verification Plan

### Automated Tests
- Run `npm run lint` (ESLint) and `npm run type-check`.
- Execute a headless Electron test that opens a sample project, triggers `ensureOllamaIsRunning`, and verifies an AI response.

### Manual Verification
- After `npm run make`, install the generated `.exe` on a Windows machine.
- Launch Lumina, open a test `.pbix` file, check that it extracts and shows the project tree.
- Verify that the AI chat returns a response, and that enabling Fusion fetches mock web data and synthesizes it.
- Confirm Ollama process runs in the background and is killed on app exit.

---
**Next Steps**
- Await your feedback on the open questions and decisions above.
- Upon approval, we will create a detailed task list (`task.md`) and start implementing files.
