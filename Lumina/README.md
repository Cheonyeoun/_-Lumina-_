# Lumina

A privacy-first, local AI code editor powered by [Ollama](https://ollama.ai). Lumina runs **entirely on your machine** — your code never leaves your computer.

---

## What Is Lumina?

Lumina is a desktop application (Windows) that combines:

- **A code editor** (Monaco Editor — the same engine behind VS Code)
- **A local AI assistant** (powered by Ollama + Llama 3.2) that understands your project context
- **Fusion Search** — an optional toggle that augments AI answers with web search results (via DuckDuckGo), while keeping your code private

Think of it as a lightweight, privacy-first AI coding companion.

---

## How to Use It

### For You (the Developer)

#### Option A: Run from Source (Development)

1. **Prerequisites**
   - [Node.js](https://nodejs.org/) v18+ installed
   - [Git](https://git-scm.com/) installed
   - Windows 10/11

2. **Clone & Install**
   ```bash
   cd D:\D-Drive\Projects\L
   npm install
   ```

3. **Run in Dev Mode**
   ```bash
   npm start
   ```
   This launches Lumina with hot-reload. The app will:
   - Automatically download Ollama (if not already installed) to `%APPDATA%/Lumina/ollama/`
   - Start the Ollama server in the background
   - Open the Lumina editor window

4. **Using the App**
   - **Left Panel (File Tree)**: Browse your project files
   - **Center Panel (Editor)**: View and edit code with syntax highlighting
   - **Right Panel (AI Chat)**: Ask questions about your code
     - Type a question and press **Enter** or click **Send**
     - Toggle **Fusion Search** checkbox to enrich answers with web results
     - Your chat history appears below in the Review Panel

#### Option B: Run the Built Installer

1. Navigate to:
   ```
   D:\D-Drive\Projects\L\out\make\squirrel.windows\x64\
   ```

2. Double-click **`LuminaInstaller.exe`**

3. The installer will set up Lumina on your system. Once installed, launch it from the Start Menu or Desktop shortcut.

---

### For Others (Distributing the App)

To share Lumina with someone else:

1. **Send them the installer file**:
   ```
   LuminaInstaller.exe  (~102 MB)
   ```
   Located in `out/make/squirrel.windows/x64/`

2. **They just double-click it** — no Node.js, no terminal, no setup required.

3. **On first launch**, Lumina will automatically:
   - Download the Ollama AI engine (~200 MB one-time download)
   - Start the local AI server
   - Open the editor

4. **System Requirements for End Users**:
   - Windows 10 or 11 (64-bit)
   - ~4 GB RAM minimum (8 GB+ recommended for smooth AI)
   - ~2 GB disk space (for Ollama + AI model)
   - Internet connection (only for first-time Ollama download and Fusion Search)

---

## Features

| Feature | Description |
|---|---|
| **Local AI** | Runs Llama 3.2 via Ollama — no cloud, no API keys |
| **Privacy-First** | Your code never leaves your machine. Web searches are sanitized. |
| **Context-Aware** | The AI reads your project structure to give relevant answers |
| **Fusion Search** | Toggle web search enrichment on/off per session |
| **Monaco Editor** | VS Code-quality code editing with syntax highlighting |
| **File Tree** | Browse and open project files |
| **Chat History** | Review past questions and answers in the Review Panel |
| **Auto-Setup** | Ollama is downloaded and configured automatically |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Electron Main Process          │
│                                             │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │ Ollama Setup │  │     AI Core          │  │
│  │ (auto-dl)    │  │ (Llama 3.2 + Fusion) │  │
│  └─────────────┘  └──────────────────────┘  │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │ Context      │  │  Search Service      │  │
│  │ Observer     │  │  (DuckDuckGo)        │  │
│  └─────────────┘  └──────────────────────┘  │
│  ┌─────────────────────────────────────────┐│
│  │         IPC Bridge (preload.js)         ││
│  └─────────────────────────────────────────┘│
├─────────────────────────────────────────────┤
│            Electron Renderer (React)        │
│                                             │
│  ┌──────┐  ┌────────┐  ┌────────────────┐  │
│  │ File │  │ Monaco │  │ Chat + Review  │  │
│  │ Tree │  │ Editor │  │ Panel          │  │
│  └──────┘  └────────┘  └────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## Build Commands

| Command | What it does |
|---|---|
| `npm start` | Launch in development mode |
| `npm run make` | Build the Windows `.exe` installer |
| `npm run package` | Package without creating installer |
| `npm run type-check` | Run TypeScript type checking |

---

## Privacy & Security

- **Your code is sacred.** Lumina never uploads your source code anywhere.
- **Fusion Search sanitization**: When web search is enabled, file paths and identifiers are stripped from queries before searching.
- **Everything runs locally** — the AI model, the editor, the file system access.
- The only network calls are:
  1. One-time Ollama download (on first launch)
  2. DuckDuckGo searches (only when Fusion is toggled ON, with sanitized queries)

---

## License

MIT
