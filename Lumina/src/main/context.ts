// src/main/context.ts
import * as fs from "fs";
import * as path from "path";

interface FileEntry {
  type: string;
  imports?: string[];
  size: number;
}

// Extensions worth scanning for context
const CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".cs",
  ".go", ".rs", ".cpp", ".c", ".h", ".css", ".html",
  ".json", ".yaml", ".yml", ".toml", ".xml", ".sql",
]);

const EXCLUDE_DIRS = new Set([
  "node_modules", "dist", ".git", ".next", "__pycache__",
  ".vscode", ".idea", "build", "out", "coverage", ".webpack",
]);

const MAX_FILE_SIZE = 512 * 1024; // 512 KB — skip huge files
const MAX_FILES = 500; // Cap to avoid scanning massive repos

export class ContextObserver {
  private projectMap: Map<string, FileEntry> = new Map();
  private rootPath: string = "";

  /** Recursively walk the directory and collect files */
  watchProject(rootPath: string) {
    this.rootPath = rootPath;
    this.projectMap.clear();
    this.scanDirectory(rootPath, 0);
  }

  /** Iterative scan with depth limit and file cap */
  private scanDirectory(dir: string, depth: number) {
    if (depth > 10 || this.projectMap.size >= MAX_FILES) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // Permission denied or inaccessible
    }

    for (const entry of entries) {
      if (this.projectMap.size >= MAX_FILES) break;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
          this.scanDirectory(fullPath, depth + 1);
        }
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!CODE_EXTENSIONS.has(ext)) continue;

      let size: number;
      try {
        size = fs.statSync(fullPath).size;
      } catch {
        continue;
      }

      if (size > MAX_FILE_SIZE) continue;

      const fileEntry: FileEntry = { type: ext.slice(1), size };

      // Parse imports only for TS/JS files (lightweight)
      if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          fileEntry.imports = this.parseImports(content);
        } catch {
          // Skip unreadable files
        }
      }

      this.projectMap.set(fullPath, fileEntry);
    }
  }

  /** Fast import parser */
  private parseImports(content: string): string[] {
    const imports: string[] = [];
    const regex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  }

  /** Return a concise summary for AI prompt — relative paths for readability */
  getContextSummary(): string {
    if (this.projectMap.size === 0) return "(No project loaded)";

    const lines: string[] = [`Project root: ${this.rootPath}`, `Files: ${this.projectMap.size}`, ""];
    for (const [file, data] of this.projectMap.entries()) {
      const relPath = path.relative(this.rootPath, file);
      const imports = data.imports?.length ? ` [imports: ${data.imports.join(", ")}]` : "";
      lines.push(`  ${relPath} (${data.type}, ${(data.size / 1024).toFixed(1)}KB)${imports}`);
    }
    return lines.join("\n");
  }
}
