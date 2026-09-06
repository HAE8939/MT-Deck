import type { Prompt } from "../types/prompt";

/**
 * Tolerant Markdown prompt parser.
 * A prompt never gets rejected for missing metadata (spec §12).
 */

export interface ParsedMarkdown {
  id: string | null;
  title: string | null;
  model?: string;
  tags: string[];
  description?: string;
  extra: Array<[string, string | string[]]>;
  promptContent: string;
  notes?: string;
}

const KNOWN_KEYS = new Set(["id", "title", "model", "tags", "description"]);

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/** Minimal YAML subset: `key: value`, `key:` followed by `- item` lines, inline `[a, b]`. */
function parseSimpleYaml(src: string): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  let lastKey: string | null = null;
  for (const rawLine of src.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed === "---" || trimmed === "..." || trimmed.startsWith("#")) continue;

    const listItem = rawLine.match(/^\s+-\s?(.*)$/);
    if (listItem && lastKey !== null) {
      const existing = result[lastKey];
      if (Array.isArray(existing)) {
        existing.push(stripQuotes(listItem[1].trim()));
      } else {
        result[lastKey] = [stripQuotes(listItem[1].trim())];
      }
      continue;
    }

    const kv = trimmed.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (kv) {
      lastKey = kv[1];
      const value = kv[2].trim();
      if (value === "") {
        result[lastKey] = "";
      } else if (value.startsWith("[") && value.endsWith("]")) {
        result[lastKey] = value
          .slice(1, -1)
          .split(",")
          .map((s) => stripQuotes(s.trim()))
          .filter(Boolean);
      } else {
        result[lastKey] = stripQuotes(value);
      }
    }
  }
  return result;
}

function findFrontmatter(raw: string): { meta: Record<string, string | string[]>; body: string } {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const lines = raw.split(/\r?\n/);
  // lines[0] === "---"; find the closing fence.
  for (let i = 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === "---" || t === "...") {
      const meta = parseSimpleYaml(lines.slice(1, i).join("\n"));
      const body = lines.slice(i + 1).join("\n");
      return { meta, body };
    }
  }
  return { meta: {}, body: raw };
}

function extractSection(body: string, headingRe: RegExp): { before: string; section?: string } {
  const lines = body.split(/\r?\n/);
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (headingRe.test(lines[i])) {
      idx = i;
      break;
    }
  }
  if (idx === -1) return { before: body };
  return { before: lines.slice(0, idx).join("\n"), section: lines.slice(idx + 1).join("\n") };
}

function trimBlank(text: string): string {
  return text.replace(/^\s*\n/, "").replace(/\n\s*$/, "");
}

export function parsePromptMarkdown(raw: string): ParsedMarkdown {
  const { meta, body } = findFrontmatter(raw);
  const asString = (v: string | string[] | undefined): string | undefined => {
    if (typeof v === "string" && v.trim() !== "") return v.trim();
    return undefined;
  };
  const tags = Array.isArray(meta.tags) ? meta.tags.filter(Boolean) : [];

  // Split body into Prompt / Notes sections (tolerant of level and case).
  const promptSplit = extractSection(body, /^\s{0,3}#{1,2}\s*Prompt\s*$/i);
  let promptContent: string;
  let notes: string | undefined;
  if (promptSplit.section !== undefined) {
    const notesSplit = extractSection(promptSplit.section, /^\s{0,3}#{1,2}\s*Notes\s*$/i);
    promptContent = trimBlank(notesSplit.before);
    if (notesSplit.section !== undefined) notes = trimBlank(notesSplit.section) || undefined;
  } else {
    promptContent = trimBlank(body);
  }

  const extra: Array<[string, string | string[]]> = [];
  for (const [key, value] of Object.entries(meta)) {
    if (!KNOWN_KEYS.has(key) && value !== "") extra.push([key, value]);
  }

  return {
    id: asString(meta.id) ?? null,
    title: asString(meta.title) ?? null,
    model: asString(meta.model),
    tags,
    description: asString(meta.description),
    extra,
    promptContent,
    notes,
  };
}

function yamlScalar(value: string): string {
  if (value === "" || /[:#]/.test(value) || value !== value.trim()) {
    return JSON.stringify(value);
  }
  return value;
}

export interface SerializedPrompt {
  id: string;
  title: string;
  model?: string;
  tags: string[];
  description?: string;
  promptContent: string;
  notes?: string;
  extra: Array<[string, string | string[]]>;
}

export function serializePromptMarkdown(input: SerializedPrompt): string {
  const lines: string[] = ["---", `id: ${input.id}`, "", `title: ${yamlScalar(input.title)}`];
  if (input.model) {
    lines.push("", `model: ${yamlScalar(input.model)}`);
  }
  if (input.tags.length > 0) {
    lines.push("", "tags:");
    for (const tag of input.tags) lines.push(`  - ${yamlScalar(tag)}`);
  }
  if (input.description) {
    lines.push("", `description: ${yamlScalar(input.description)}`);
  }
  for (const [key, value] of input.extra) {
    if (Array.isArray(value)) {
      lines.push("", `${key}:`);
      for (const item of value) lines.push(`  - ${yamlScalar(item)}`);
    } else {
      lines.push("", `${key}: ${yamlScalar(value)}`);
    }
  }
  lines.push("---", "", "# Prompt", "", input.promptContent.trim());
  if (input.notes && input.notes.trim()) {
    lines.push("", "# Notes", "", input.notes.trim());
  }
  return lines.join("\n") + "\n";
}

/** Removes Windows-invalid filename characters (spec §17). */
export function sanitizeFilename(title: string): string {
  const cleaned = title
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "");
  return cleaned || "未命名";
}

/** Builds the runtime Prompt object from a scanned file. */
export function buildPrompt(
  filePath: string,
  relativePath: string,
  raw: string,
  modifiedAt: number
): Prompt {
  const parsed = parsePromptMarkdown(raw);
  const segments = relativePath.split("/");
  const fileName = segments[segments.length - 1] ?? relativePath;
  const categoryPath = segments.slice(0, -1);
  const fallbackTitle = fileName.replace(/\.(md|markdown)$/i, "");
  return {
    key: parsed.id ? `id:${parsed.id}` : `path:${relativePath}`,
    id: parsed.id,
    filePath,
    relativePath,
    fileName,
    title: parsed.title ?? fallbackTitle,
    categoryPath,
    model: parsed.model,
    tags: parsed.tags,
    description: parsed.description,
    promptContent: parsed.promptContent,
    notes: parsed.notes,
    extraFrontmatter: parsed.extra,
    modifiedAt,
    raw,
  };
}
