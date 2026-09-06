/**
 * Prompt data model — mirrors the MT-Deck V1.0 specification (§11).
 */
export interface Prompt {
  /** Stable UI key: `id:<uuid>` when the file has an ID, otherwise `path:<relativePath>`. */
  key: string;
  /** Stable identity from frontmatter. Null for legacy files without one. */
  id: string | null;

  filePath: string;
  relativePath: string;
  fileName: string;

  title: string;
  categoryPath: string[];
  model?: string;
  tags: string[];
  description?: string;
  promptContent: string;
  notes?: string;
  /** Unknown frontmatter keys preserved on rewrite (no silent data loss). */
  extraFrontmatter: Array<[string, string | string[]]>;

  modifiedAt: number;
  /** Raw file content as last read — used for external-modification conflict detection. */
  raw: string;
}

export type ThemeMode = "light" | "dark" | "system";

export interface RecentEntry {
  id: string;
  lastOpened: number;
}

export interface AppSettings {
  libraryRoot: string | null;
  theme: ThemeMode;
  favorites: string[];
  recent: RecentEntry[];
}
