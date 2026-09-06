import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { applyFsEvents, getAppState, requestCloseApp, requestCloseEditor, openEditor, selectPrompt, copyPrompt, saveEditor, cancelConflict } from "../store/store";

/** Subscribes to Rust file-watcher events and applies them to the runtime library. */
export function useFileWatcher(): void {
  useEffect(() => {
    const un = listen<{ kind: string; paths: string[] }[]>("fs-events", (event) => {
      void applyFsEvents(event.payload);
    });
    return () => {
      void un.then((f) => f());
    };
  }, []);
}

/** Intercepts the window close button to protect unsaved changes. */
export function useAppCloseGuard(): void {
  useEffect(() => {
    const un = listen("app-close-requested", () => {
      void requestCloseApp(() => void getCurrentWindow().destroy());
    });
    return () => {
      void un.then((f) => f());
    };
  }, []);
}

function focusSearch(): void {
  document.getElementById("prompt-search")?.focus();
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

/** Escape closes the highest active layer: Confirm → Conflict → Editor → Detail → Search. */
function handleEscape(): void {
  const s = getAppState();
  if (s.confirm) {
    const cancel = s.confirm.actions.find((a) => a.label === "取消");
    cancel?.run();
    return;
  }
  if (s.conflict) {
    // Conflict dialog: Esc = Cancel (keep editing, do not touch the file).
    cancelConflict();
    return;
  }
  if (s.editor) {
    requestCloseEditor();
    return;
  }
  if (s.selectedKey) {
    selectPrompt(null);
    return;
  }
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.id === "prompt-search") active.blur();
}

/** Global keyboard shortcuts (spec §25). */
export function useShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const s = getAppState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (e.key === "Escape") {
        handleEscape();
        return;
      }
      if (mod && key === "k") {
        e.preventDefault();
        focusSearch();
        return;
      }
      if (mod && key === "n") {
        e.preventDefault();
        openEditor();
        return;
      }
      if (mod && key === "s") {
        if (s.editor) {
          e.preventDefault();
          void saveEditor();
        }
        return;
      }
      if (mod && key === "c") {
        // Copy prompt only when no text selection and no editable target owns the copy action.
        const selection = window.getSelection()?.toString() ?? "";
        if (!isEditableTarget(e.target) && !selection && s.selectedKey && !s.editor && !s.confirm) {
          e.preventDefault();
          const prompt = s.promptByKey[s.selectedKey];
          if (prompt) void copyPrompt(prompt);
        }
        return;
      }
      if (e.key === "/" && !isEditableTarget(e.target)) {
        e.preventDefault();
        focusSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

/** Applies the light/dark/system theme to the document root. */
export function useThemeEffect(theme: "light" | "dark" | "system"): void {
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  useEffect(() => {
    const dark = theme === "dark" || (theme === "system" && systemDark);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [theme, systemDark]);
}

/** Respects prefers-reduced-motion for card stagger animations. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
