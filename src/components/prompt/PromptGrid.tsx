import { useEffect, useMemo, useRef, useState } from "react";
import { useApp, selectPrompt, openEditor } from "../../store/store";
import { PromptCard } from "./PromptCard";
import { usePrefersReducedMotion } from "../../hooks/useAppHooks";
import type { Prompt } from "../../types/prompt";

/**
 * Card grid with roving-focus arrow-key navigation (spec §25 Grid Navigation).
 */
export function PromptGrid({ prompts }: { prompts: Prompt[] }) {
  const app = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const animate = !reducedMotion && Date.now() - app.firstLoadAt < 1600 && app.searchQuery === "";

  // Clear stale focus when the focused prompt disappears from the list.
  useEffect(() => {
    if (focusedKey && !prompts.some((p) => p.key === focusedKey)) setFocusedKey(null);
  }, [prompts, focusedKey]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys = prompts.map((p) => p.key);
    if (keys.length === 0) return;
    const currentIndex = focusedKey ? keys.indexOf(focusedKey) : -1;
    const cards = containerRef.current?.querySelectorAll<HTMLElement>(".prompt-card");
    if (!cards) return;

    const moveTo = (index: number) => {
      const clamped = Math.max(0, Math.min(keys.length - 1, index));
      const key = keys[clamped];
      setFocusedKey(key);
      const card = cards[clamped];
      card?.focus();
      card?.scrollIntoView({ block: "nearest" });
      e.preventDefault();
    };

    // Columns inferred from actual card x-positions (responsive-safe).
    const columnsFor = (index: number): number => {
      const target = cards[Math.max(0, index)] as HTMLElement | undefined;
      if (!target) return 1;
      const baseTop = target.offsetTop;
      let cols = 0;
      for (const card of cards) {
        if (Math.abs((card as HTMLElement).offsetTop - baseTop) < 4) cols++;
      }
      return Math.max(1, cols);
    };

    if (e.key === "ArrowRight" && currentIndex >= 0) {
      moveTo(currentIndex + 1);
    } else if (e.key === "ArrowLeft" && currentIndex > 0) {
      moveTo(currentIndex - 1);
    } else if (e.key === "ArrowDown") {
      const cols = columnsFor(currentIndex === -1 ? 0 : currentIndex);
      moveTo(currentIndex === -1 ? 0 : currentIndex + cols);
    } else if (e.key === "ArrowUp") {
      if (currentIndex <= 0) return;
      const cols = columnsFor(currentIndex);
      moveTo(currentIndex - cols);
    } else if (e.key === "Enter") {
      if (focusedKey) {
        selectPrompt(focusedKey);
        e.preventDefault();
      }
    }
  };

  const emptyHint = useMemo(() => {
    if (app.searchQuery) return "没有匹配的提示词。";
    if (app.nav.kind === "favorites") return "收藏的提示词会显示在这里。";
    if (app.nav.kind === "recent") return "打开过的提示词会显示在这里。";
    return null;
  }, [app.searchQuery, app.nav.kind]);

  if (prompts.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-title">还没有提示词。</p>
        <p className="empty-sub">
          {emptyHint ?? "创建你的第一条提示词，或将 Markdown 文件放入该文件夹。"}
        </p>
        {!app.searchQuery && app.nav.kind === "all" && (
          <button className="btn btn-primary" onClick={() => openEditor()}>
            + 新建提示词
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`prompt-grid${animate ? " is-first-load" : ""}`}
      ref={containerRef}
      onKeyDown={onKeyDown}
      role="list"
      aria-label="提示词"
    >
      {prompts.map((prompt, i) => (
        <PromptCard
          key={prompt.key}
          prompt={prompt}
          index={i}
          focused={focusedKey === prompt.key}
          onFocus={() => setFocusedKey(prompt.key)}
        />
      ))}
    </div>
  );
}
