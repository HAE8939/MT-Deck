import { useSyncExternalStore } from "react";
import { api, fileToPrompt, isIgnoredRelativePath, toAbsolutePath, toRelativePath, findUniquePromptPath } from "../services/promptService";
import { buildPrompt, sanitizeFilename, serializePromptMarkdown } from "../services/promptParser";
import { searchService } from "../services/searchService";
import type { AppSettings, Prompt, RecentEntry, ThemeMode } from "../types/prompt";

export type Nav =
  | { kind: "all" }
  | { kind: "favorites" }
  | { kind: "recent" }
  | { kind: "folder"; value: string }
  | { kind: "tag"; value: string }
  | { kind: "model"; value: string };

export interface EditorState {
  isNew: boolean;
  promptKey: string | null;
  filePath: string | null;
  folder: string;
  title: string;
  model: string;
  tagsInput: string;
  description: string;
  promptContent: string;
  notes: string;
  /** Raw content when opened; null for new prompts. Basis of external-conflict detection. */
  originalContent: string | null;
  hasId: boolean;
}

export interface ConfirmAction {
  label: string;
  variant?: "primary" | "danger" | "default";
  run: () => void | Promise<void>;
}

export interface ConfirmState {
  title: string;
  message: string;
  actions: ConfirmAction[];
}

export interface ConflictState {
  filePath: string;
  performSave: () => Promise<void>;
  reloadIntoEditor: () => Promise<void>;
}

interface AppState {
  ready: boolean;
  libraryRoot: string | null;
  libraryName: string;
  prompts: Prompt[];
  promptByKey: Record<string, Prompt>;
  favorites: string[];
  recent: RecentEntry[];
  theme: ThemeMode;
  searchQuery: string;
  nav: Nav;
  selectedKey: string | null;
  editor: EditorState | null;
  conflict: ConflictState | null;
  confirm: ConfirmState | null;
  renaming: Prompt | null;
  toast: { text: string; key: number } | null;
  firstLoadAt: number;
}

const initialState: AppState = {
  ready: false,
  libraryRoot: null,
  libraryName: "",
  prompts: [],
  promptByKey: {},
  favorites: [],
  recent: [],
  theme: "system",
  searchQuery: "",
  nav: { kind: "all" },
  selectedKey: null,
  editor: null,
  conflict: null,
  confirm: null,
  renaming: null,
  toast: null,
  firstLoadAt: 0,
};

let state: AppState = initialState;
const listeners = new Set<() => void>();

function set(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getAppState = (): AppState => state;

export function useApp(): AppState {
  return useSyncExternalStore(subscribe, getAppState);
}

// ---------------------------------------------------------------------------
// Settings persistence (application state only — never prompt content)
// ---------------------------------------------------------------------------

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function persistSettings(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const s: AppSettings = {
      libraryRoot: state.libraryRoot,
      theme: state.theme,
      favorites: state.favorites,
      recent: state.recent,
    };
    api.saveSettings(s).catch(() => undefined);
  }, 300);
}

// ---------------------------------------------------------------------------
// Library loading
// ---------------------------------------------------------------------------

function sortPrompts(byKey: Record<string, Prompt>): Prompt[] {
  return Object.values(byKey).sort(
    (a, b) => b.modifiedAt - a.modifiedAt || a.title.localeCompare(b.title)
  );
}

async function upsertFromDisk(root: string, absolutePath: string): Promise<void> {
  const rel = toRelativePath(root, absolutePath);
  if (!rel || isIgnoredRelativePath(rel)) return;
  const file = await api.readFile(absolutePath);
  const byKey = { ...state.promptByKey };
  // Remove any existing entry pointing at this path (rename/move handling).
  for (const p of Object.values(byKey)) {
    if (p.filePath === absolutePath || p.relativePath === rel) {
      searchService.remove(p.key);
      delete byKey[p.key];
    }
  }
  if (file !== null) {
    const prompt = buildPrompt(absolutePath, rel, file.content, file.modified_at);
    if (byKey[prompt.key]) searchService.remove(prompt.key);
    byKey[prompt.key] = prompt;
    searchService.upsert(prompt);
  } else {
    // File no longer exists: clean any stale references (spec §16.2).
    for (const p of Object.values(byKey)) {
      if (p.filePath === absolutePath) {
        searchService.remove(p.key);
        delete byKey[p.key];
      }
    }
  }
  set({
    promptByKey: byKey,
    prompts: sortPrompts(byKey),
    favorites: state.favorites.filter((id) =>
      Object.values(byKey).some((p) => p.id === id)
    ),
    recent: state.recent.filter((r) => Object.values(byKey).some((p) => p.id === r.id)),
  });
  persistSettings();
}

export async function loadLibrary(root: string): Promise<void> {
  try {
    const files = await api.loadLibrary(root);
    const byKey: Record<string, Prompt> = {};
    const prompts: Prompt[] = [];
    for (const file of files) {
      const prompt = fileToPrompt(file);
      if (byKey[prompt.key]) continue; // duplicate UUID: first wins
      byKey[prompt.key] = prompt;
      prompts.push(prompt);
    }
    prompts.sort((a, b) => b.modifiedAt - a.modifiedAt || a.title.localeCompare(b.title));
    searchService.rebuild(prompts);
    const libraryName = root.split(/[\\/]/).filter(Boolean).pop() ?? root;
    set({
      libraryRoot: root,
      libraryName,
      promptByKey: byKey,
      prompts,
      firstLoadAt: Date.now(),
      favorites: state.favorites.filter((id) => prompts.some((p) => p.id === id)),
      recent: state.recent.filter((r) => prompts.some((p) => p.id === r.id)),
    });
    await api.startWatcher(root).catch(() => undefined);
    persistSettings();
  } catch (err) {
    const message = err instanceof Error ? err.message : "无法加载提示词库";
    console.error("Library load failed:", err);
    showToast(message);
  }
}

export async function initApp(): Promise<void> {
  try {
    const s = (await api.loadSettings()) as AppSettings | null;
    if (s && typeof s === "object") {
      set({
        theme: s.theme ?? "system",
        favorites: Array.isArray(s.favorites) ? s.favorites : [],
        recent: Array.isArray(s.recent) ? s.recent : [],
        libraryRoot: s.libraryRoot ?? null,
      });
    }
  } catch {
    // first launch — no settings yet
  }
  if (state.libraryRoot) await loadLibrary(state.libraryRoot);
  set({ ready: true });
}

// ---------------------------------------------------------------------------
// Navigation / selection
// ---------------------------------------------------------------------------

export function setNav(nav: Nav): void {
  set({ nav, searchQuery: "" });
}

export function setSearchQuery(query: string): void {
  set({ searchQuery: query });
}

export function selectPrompt(key: string | null): void {
  const prompt = key ? state.promptByKey[key] : undefined;
  if (prompt?.id) {
    const recent = [
      { id: prompt.id, lastOpened: Date.now() },
      ...state.recent.filter((r) => r.id !== prompt.id),
    ].slice(0, 50);
    set({ selectedKey: key, recent });
    persistSettings();
  } else {
    set({ selectedKey: key });
  }
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export function toggleFavorite(prompt: Prompt): void {
  if (!prompt.id) {
    showToast("请先用 MT-Deck 编辑并保存这条提示词，生成稳定 ID 后再收藏。");
    return;
  }
  const favorites = state.favorites.includes(prompt.id)
    ? state.favorites.filter((id) => id !== prompt.id)
    : [prompt.id, ...state.favorites];
  set({ favorites });
  persistSettings();
}

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

export async function copyPrompt(prompt: Prompt): Promise<void> {
  try {
    await api.copyToClipboard(prompt.promptContent);
    showToast("已复制提示词");
  } catch {
    showToast("无法访问剪贴板。");
  }
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;
export function showToast(text: string): void {
  set({ toast: { text, key: Date.now() } });
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => set({ toast: null }), 2400);
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

export function openEditor(prompt?: Prompt): void {
  if (prompt) {
    set({
      editor: {
        isNew: false,
        promptKey: prompt.key,
        filePath: prompt.filePath,
        folder: prompt.categoryPath.join("/"),
        title: prompt.title,
        model: prompt.model ?? "",
        tagsInput: prompt.tags.join(", "),
        description: prompt.description ?? "",
        promptContent: prompt.promptContent,
        notes: prompt.notes ?? "",
        originalContent: prompt.raw,
        hasId: prompt.id !== null,
      },
    });
  } else {
    const folder = state.nav.kind === "folder" ? state.nav.value : "";
    set({
      editor: {
        isNew: true,
        promptKey: null,
        filePath: null,
        folder,
        title: "",
        model: "",
        tagsInput: "",
        description: "",
        promptContent: "",
        notes: "",
        originalContent: null,
        hasId: false,
      },
    });
  }
}

function editorDirty(editor: EditorState): boolean {
  if (editor.isNew) {
    return (
      editor.title !== "" ||
      editor.model !== "" ||
      editor.tagsInput !== "" ||
      editor.description !== "" ||
      editor.promptContent !== "" ||
      editor.notes !== ""
    );
  }
  const prompt = editor.promptKey ? state.promptByKey[editor.promptKey] : undefined;
  if (!prompt) return true;
  return (
    editor.title !== prompt.title ||
    editor.model !== (prompt.model ?? "") ||
    editor.tagsInput !== prompt.tags.join(", ") ||
    editor.description !== (prompt.description ?? "") ||
    editor.promptContent !== prompt.promptContent ||
    editor.notes !== (prompt.notes ?? "")
  );
}

export function requestCloseEditor(): void {
  const editor = state.editor;
  if (!editor) return;
  if (editorDirty(editor)) {
    set({
      confirm: {
        title: "放弃更改？",
        message: "该提示词有未保存的更改，关闭编辑器将丢弃这些更改。",
        actions: [
          { label: "放弃", variant: "danger", run: () => set({ editor: null, confirm: null }) },
          { label: "取消", run: () => set({ confirm: null }) },
        ],
      },
    });
  } else {
    set({ editor: null });
  }
}

export function updateEditor(patch: Partial<EditorState>): void {
  if (state.editor) set({ editor: { ...state.editor, ...patch } });
}

function parseTagsInput(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Saves the editor. Returns "saved" | "conflict" | "invalid". */
export async function saveEditor(): Promise<"saved" | "conflict" | "invalid"> {
  const editor = state.editor;
  const root = state.libraryRoot;
  if (!editor || !root) return "invalid";
  if (!editor.title.trim()) {
    showToast("保存提示词需要填写标题。");
    return "invalid";
  }
  if (!editor.promptContent.trim()) {
    showToast("提示词内容不能为空。");
    return "invalid";
  }

  const tags = parseTagsInput(editor.tagsInput);
  const buildMarkdown = (id: string) =>
    serializePromptMarkdown({
      id,
      title: editor.title.trim(),
      model: editor.model.trim() || undefined,
      tags,
      description: editor.description.trim() || undefined,
      promptContent: editor.promptContent,
      notes: editor.notes.trim() || undefined,
      extra: editor.isNew ? [] : (state.promptByKey[editor.promptKey!]?.extraFrontmatter ?? []),
    });

  if (editor.isNew) {
    const folder = editor.folder
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean)
      .join("/");
    const title = editor.title.trim();
    const { absolutePath } = await findUniquePromptPath(root, folder, sanitizeFilename(title));
    const id = crypto.randomUUID();
    await api.writeFile(absolutePath, buildMarkdown(id));
    await upsertFromDisk(root, absolutePath);
    const saved = state.promptByKey[`id:${id}`];
    set({ editor: null, selectedKey: saved ? saved.key : null, nav: { kind: "all" }, searchQuery: "" });
    showToast("提示词已创建");
    return "saved";
  }

  // Existing prompt: external-modification conflict check before overwrite (spec §15).
  const filePath = editor.filePath!;
  const current = await api.readFile(filePath);
  if (
    editor.originalContent !== null &&
    current !== null &&
    current.content !== editor.originalContent
  ) {
    set({
      conflict: {
        filePath,
        performSave: async () => {
          // Overwrite external changes.
          const id =
            editor.hasId
              ? (state.promptByKey[editor.promptKey!]?.id ?? crypto.randomUUID())
              : crypto.randomUUID();
          await api.writeFile(filePath, buildMarkdown(id));
          await upsertFromDisk(root, filePath);
          set({ editor: null, conflict: null });
          showToast("提示词已保存");
        },
        reloadIntoEditor: async () => {
          // Reload external changes into the editor.
          const fresh = await api.readFile(filePath);
          if (fresh) {
            const current = state.promptByKey[editor.promptKey ?? ""];
            const rel = current ? current.relativePath : toRelativePath(root, filePath);
            const parsed = buildPrompt(filePath, rel, fresh.content, fresh.modified_at);
            set({
              conflict: null,
              editor: {
                ...editor,
                title: parsed.title,
                model: parsed.model ?? "",
                tagsInput: parsed.tags.join(", "),
                description: parsed.description ?? "",
                promptContent: parsed.promptContent,
                notes: parsed.notes ?? "",
                originalContent: fresh.content,
                hasId: parsed.id !== null,
              },
            });
          } else {
            set({ conflict: null });
          }
        },
      },
    });
    return "conflict";
  }

  const id = editor.hasId
    ? (state.promptByKey[editor.promptKey!]?.id ?? crypto.randomUUID())
    : crypto.randomUUID();
  await api.writeFile(filePath, buildMarkdown(id));
  await upsertFromDisk(root, filePath);
  set({ editor: null });
  showToast("提示词已保存");
  return "saved";
}

// ---------------------------------------------------------------------------
// Rename file (explicit, separate action — spec §19)
// ---------------------------------------------------------------------------

export function requestRename(prompt: Prompt): void {
  set({ renaming: prompt });
}

export function clearRenaming(): void {
  set({ renaming: null });
}

export function cancelConflict(): void {
  set({ conflict: null });
}

export async function confirmRename(newName: string): Promise<void> {
  const prompt = state.renaming;
  if (!prompt) return;
  const clean = sanitizeFilename(newName);
  if (!clean || clean === prompt.fileName.replace(/\.(md|markdown)$/i, "")) {
    set({ renaming: null });
    return;
  }
  const ext = prompt.fileName.match(/\.(md|markdown)$/i)?.[0] ?? ".md";
  const dir = prompt.filePath.slice(0, prompt.filePath.length - prompt.fileName.length);
  const target = dir + clean + ext;
  try {
    await api.renameFile(prompt.filePath, target);
    set({ renaming: null });
    if (state.libraryRoot) await upsertFromDisk(state.libraryRoot, target);
    showToast("文件已重命名");
  } catch (err) {
    const message = err instanceof Error ? err.message : "重命名失败";
    console.error("Rename failed:", err);
    showToast(message);
  }
}

// ---------------------------------------------------------------------------
// Delete (Recycle Bin — spec §17)
// ---------------------------------------------------------------------------

export function requestDelete(prompt: Prompt): void {
  set({
    confirm: {
      title: `删除「${prompt.title}」？`,
      message: "该 Markdown 文件将被移入回收站。",
      actions: [
        {
          label: "移入回收站",
          variant: "danger",
          run: async () => {
            try {
              await api.trashFile(prompt.filePath);
              if (state.libraryRoot) await upsertFromDisk(state.libraryRoot, prompt.filePath);
              if (state.selectedKey === prompt.key) set({ selectedKey: null });
              showToast("已移入回收站");
            } catch (err) {
              const message = err instanceof Error ? err.message : "删除失败";
              console.error("Delete failed:", err);
              showToast(message);
            }
            set({ confirm: null });
          },
        },
        { label: "取消", run: () => set({ confirm: null }) },
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// Show file
// ---------------------------------------------------------------------------

export async function revealFile(prompt: Prompt): Promise<void> {
  try {
    await api.revealFile(prompt.filePath);
  } catch (err) {
    const message = err instanceof Error ? err.message : "无法打开文件位置";
    console.error("Reveal file failed:", err);
    showToast(message);
  }
}

// ---------------------------------------------------------------------------
// Theme / first launch
// ---------------------------------------------------------------------------

export function setTheme(theme: ThemeMode): void {
  set({ theme });
  persistSettings();
}

export async function chooseLibraryFolder(): Promise<void> {
  const folder = await api.selectFolder();
  if (!folder) return;
  await api.seedSamples(folder).catch(() => undefined); // seeds only if the library is empty
  await loadLibrary(folder);
}

async function doChangeLibrary(): Promise<void> {
  const folder = await api.selectFolder();
  if (!folder) return; // user cancelled the picker
  if (folder === state.libraryRoot) return; // same library — nothing to do
  set({ selectedKey: null, nav: { kind: "all" }, searchQuery: "" });
  await api.seedSamples(folder).catch(() => undefined); // no-op unless the folder is empty
  await loadLibrary(folder); // swaps state, restarts watcher on new root, persists
}

/** Switches the local prompt library after first launch (guarded against losing unsaved edits). */
export async function changeLibrary(): Promise<void> {
  const editor = state.editor;
  if (editor && editorDirty(editor)) {
    set({
      confirm: {
        title: "切换资料库目录？",
        message: "当前编辑器有未保存的更改，切换资料库将关闭编辑器并丢弃这些更改。",
        actions: [
          {
            label: "继续切换",
            variant: "danger",
            run: () => {
              set({ editor: null, confirm: null });
              void doChangeLibrary();
            },
          },
          { label: "取消", run: () => set({ confirm: null }) },
        ],
      },
    });
    return;
  }
  if (editor) set({ editor: null });
  await doChangeLibrary();
}

export async function createNewLibrary(): Promise<void> {
  const parent = await api.selectFolder();
  if (!parent) return;
  try {
    const root = await api.createLibrary(parent);
    await api.seedSamples(root).catch(() => undefined);
    await loadLibrary(root);
    showToast("提示词库已创建");
  } catch (err) {
    const message = err instanceof Error ? err.message : "创建资料库失败";
    console.error("Create library failed:", err);
    showToast(message);
  }
}

// ---------------------------------------------------------------------------
// File watcher events
// ---------------------------------------------------------------------------

interface FsEvent {
  kind: string;
  paths: string[];
}

export async function applyFsEvents(events: FsEvent[]): Promise<void> {
  const root = state.libraryRoot;
  if (!root) return;
  const mdPaths: string[] = [];
  let structural = false;
  for (const event of events) {
    for (const p of event.paths) {
      if (/\.(md|markdown)$/i.test(p)) {
        mdPaths.push(p);
      } else {
        structural = true;
      }
    }
  }
  if (structural) {
    await loadLibrary(root);
    return;
  }
  for (const p of mdPaths) {
    await upsertFromDisk(root, p);
  }
}

// ---------------------------------------------------------------------------
// App close protection (unsaved editor changes — spec §61)
// ---------------------------------------------------------------------------

export async function requestCloseApp(destroy: () => void): Promise<void> {
  const editor = state.editor;
  if (editor && editorDirty(editor)) {
    set({
      confirm: {
        title: "退出 MT-Deck？",
        message: "该提示词有未保存的更改，现在退出将丢失。",
        actions: [
          {
            label: "保存并退出",
            variant: "primary",
            run: async () => {
              const result = await saveEditor();
              set({ confirm: null });
              if (result === "saved") destroy();
            },
          },
          {
            label: "放弃并退出",
            variant: "danger",
            run: () => {
              set({ confirm: null });
              destroy();
            },
          },
          { label: "取消", run: () => set({ confirm: null }) },
        ],
      },
    });
  } else {
    destroy();
  }
}

// ---------------------------------------------------------------------------
// Derived data
// ---------------------------------------------------------------------------

export interface FolderNode {
  name: string;
  path: string;
  depth: number;
  count: number;
}

export function deriveFolders(prompts: Prompt[]): FolderNode[] {
  const counts = new Map<string, number>();
  for (const p of prompts) {
    const path = p.categoryPath.join("/");
    if (!path) continue;
    counts.set(path, (counts.get(path) ?? 0) + 1);
  }
  const nodes: FolderNode[] = [];
  const walk = (prefix: string, depth: number) => {
    const children = new Map<string, number>();
    for (const [path, count] of counts) {
      if (!path.startsWith(prefix)) continue;
      const rest = prefix ? path.slice(prefix.length + 1) : path;
      const seg = rest.split("/")[0];
      if (seg) children.set(seg, (children.get(seg) ?? 0) + count);
    }
    for (const [name, count] of [...children.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const path = prefix ? `${prefix}/${name}` : name;
      nodes.push({ name, path, depth, count });
      walk(path, depth + 1);
    }
  };
  walk("", 0);
  return nodes;
}

export function deriveTags(prompts: Prompt[]): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  for (const p of prompts) {
    for (const tag of p.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function deriveModels(prompts: Prompt[]): Array<{ model: string; count: number }> {
  const counts = new Map<string, number>();
  for (const p of prompts) {
    if (p.model) counts.set(p.model, (counts.get(p.model) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count || a.model.localeCompare(b.model));
}

export { toAbsolutePath };
