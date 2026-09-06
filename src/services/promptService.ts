import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { buildPrompt } from "./promptParser";
import type { Prompt } from "../types/prompt";

export interface LibFile {
  path: string;
  relative_path: string;
  modified_at: number;
  content: string;
}

export interface ReadFileResult {
  content: string;
  modified_at: number;
}

export const api = {
  selectFolder: () => invoke<string | null>("select_folder"),
  loadLibrary: (root: string) => invoke<LibFile[]>("load_library", { root }),
  readFile: (path: string) => invoke<ReadFileResult | null>("read_file", { path }),
  writeFile: (path: string, content: string) => invoke<number>("write_prompt_file", { path, content }),
  renameFile: (from: string, to: string) => invoke<void>("rename_file", { from, to }),
  createLibrary: (parent: string) => invoke<string>("create_library", { parent }),
  trashFile: (path: string) => invoke<void>("trash_file", { path }),
  revealFile: (path: string) => invoke<void>("reveal_file", { path }),
  seedSamples: (root: string) => invoke<number>("seed_samples", { root }),
  startWatcher: (root: string) => invoke<void>("start_watcher", { root }),
  loadSettings: () => invoke<unknown>("load_settings"),
  saveSettings: (settings: unknown) => invoke<void>("save_settings", { settings }),
  copyToClipboard: (text: string) => writeText(text),
};

/** Ignore rules mirrored from the Rust scanner, applied to watcher events. */
const IGNORED_FOLDERS = new Set([".git", "node_modules", "dist", "build", "target"]);
const IGNORED_FILES = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);

export function isIgnoredRelativePath(rel: string): boolean {
  const segments = rel.split("/");
  const fileName = segments[segments.length - 1];
  if (!/\.(md|markdown)$/i.test(fileName)) return false;
  if (IGNORED_FILES.has(fileName) || fileName.startsWith("_") || fileName.startsWith(".")) {
    return true;
  }
  return segments.slice(0, -1).some(
    (s) => IGNORED_FOLDERS.has(s) || s.startsWith("_") || s.startsWith(".")
  );
}

export function fileToPrompt(file: LibFile): Prompt {
  return buildPrompt(file.path, file.relative_path, file.content, file.modified_at);
}

/** Joins a library root (Windows backslash style) with a `/`-separated relative path. */
export function toAbsolutePath(root: string, relativePath: string): string {
  const sep = root.includes("\\") ? "\\" : "/";
  return [root, ...relativePath.split("/")].join(sep);
}

export function toRelativePath(root: string, absolutePath: string): string {
  const normalizedRoot = root.endsWith("\\") || root.endsWith("/") ? root : root + (root.includes("\\") ? "\\" : "/");
  let rel = absolutePath.startsWith(normalizedRoot)
    ? absolutePath.slice(normalizedRoot.length)
    : absolutePath;
  return rel.replace(/\\/g, "/");
}

/** Title → unique file path inside a relative folder (appends " 2", " 3", … when taken). */
export async function findUniquePromptPath(
  root: string,
  folder: string,
  title: string
): Promise<{ absolutePath: string; relativePath: string }> {
  const base = title;
  const folderPrefix = folder ? folder + "/" : "";
  let candidate = base;
  let n = 2;
  // Loop over in-memory check via readFile (null = free).
  for (;;) {
    const rel = `${folderPrefix}${candidate}.md`;
    const abs = toAbsolutePath(root, rel);
    const existing = await api.readFile(abs);
    if (existing === null) return { absolutePath: abs, relativePath: rel };
    candidate = `${base} ${n}`;
    n += 1;
  }
}
