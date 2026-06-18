// src/main/input-handler.ts
import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";
import * as os from "os";

export class InputHandler {
  /**
   * Process an input path (file or folder).
   * - Directory → returns it directly.
   * - .pbix file → extracts to a temp folder.
   * - Other file → returns its containing directory.
   */
  static async processInput(inputPath: string): Promise<string> {
    const resolvedPath = path.resolve(inputPath);

    let stats: fs.Stats;
    try {
      stats = fs.statSync(resolvedPath);
    } catch {
      throw new Error(`Path does not exist: ${resolvedPath}`);
    }

    if (stats.isDirectory()) {
      return resolvedPath;
    }

    // Handle .pbix files (Power BI reports)
    if (resolvedPath.endsWith(".pbix")) {
      console.log("[input-handler] Detected .pbix file — extracting");
      return await this.extractArchive(resolvedPath);
    }

    // For any other file, return its parent directory
    return path.dirname(resolvedPath);
  }

  /** Extract archive to a temporary directory */
  private static async extractArchive(filePath: string): Promise<string> {
    const baseName = path.basename(filePath, path.extname(filePath));
    const tempDir = path.join(os.tmpdir(), `lumina-${baseName}-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const zip = new AdmZip(filePath);
    zip.extractAllTo(tempDir, true);
    return tempDir;
  }
}
