import { useMemo, useState } from "react";
import { useApp, setSearchQuery, openEditor } from "../../store/store";
import { searchService } from "../../services/searchService";
import { useDebounce } from "../../hooks/useDebounce";
import { Sidebar } from "./Sidebar";
import { PromptGrid } from "../prompt/PromptGrid";
import { PromptDetail } from "../prompt/PromptDetail";
import { PromptEditor } from "../prompt/PromptEditor";
import { Dialogs } from "../common/Dialogs";
import { SearchIcon, PlusIcon } from "../common/icons";
import type { Nav } from "../../store/store";

function navLabel(nav: Nav): string {
  switch (nav.kind) {
    case "all":
      return "全部提示词";
    case "favorites":
      return "收藏";
    case "recent":
      return "最近使用";
    case "folder":
      return nav.value;
    case "tag":
      return nav.value;
    case "model":
      return nav.value;
  }
}

export function AppShell() {
  const app = useApp();
  const [searchFocused, setSearchFocused] = useState(false);

  // Debounce search query by 180ms to avoid excessive re-renders
  const debouncedSearchQuery = useDebounce(app.searchQuery, 180);

  const visiblePrompts = useMemo(() => {
    let list = app.prompts;
    const nav = app.nav;
    if (nav.kind === "favorites") {
      list = list.filter((p) => p.id && app.favorites.includes(p.id));
    } else if (nav.kind === "recent") {
      const order = new Map(app.recent.map((r, i) => [r.id, i]));
      list = list
        .filter((p) => p.id && order.has(p.id))
        .sort(
          (a, b) =>
            (order.get(a.id!) ?? 0) - (order.get(b.id!) ?? 0)
        );
    } else if (nav.kind === "folder") {
      const prefix = nav.value + "/";
      list = list.filter(
        (p) => p.categoryPath.join("/") === nav.value || p.categoryPath.join("/").startsWith(prefix)
      );
    } else if (nav.kind === "tag") {
      list = list.filter((p) => p.tags.includes(nav.value));
    } else if (nav.kind === "model") {
      list = list.filter((p) => p.model === nav.value);
    }

    const keys = searchService.search(debouncedSearchQuery);
    if (keys !== null) {
      const keySet = new Set(keys);
      list = list.filter((p) => keySet.has(p.key));
      if (nav.kind !== "recent") {
        const rank = new Map(keys.map((k, i) => [k, i]));
        list = [...list].sort((a, b) => (rank.get(a.key) ?? 0) - (rank.get(b.key) ?? 0));
      }
    }
    return list;
  }, [app.prompts, app.nav, debouncedSearchQuery, app.favorites, app.recent]);

  const selected = app.selectedKey ? (app.promptByKey[app.selectedKey] ?? null) : null;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <header className="toolbar">
          <div className="toolbar-title">
            <h2 className="toolbar-heading">{navLabel(app.nav)}</h2>
            <span className="toolbar-count">
              {visiblePrompts.length} 条提示词
            </span>
          </div>
          <div className={`search-wrap${searchFocused ? " is-focused" : ""}`}>
            <span className="search-icon">
              <SearchIcon size={15} />
            </span>
            <input
              id="prompt-search"
              type="text"
              className="search-input"
              placeholder="搜索提示词..."
              value={app.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="search-kbd">Ctrl K</kbd>
          </div>
          <button className="btn btn-primary btn-new" onClick={() => openEditor()}>
            <PlusIcon size={15} />
            新建提示词
          </button>
        </header>
        <PromptGrid prompts={visiblePrompts} />
      </main>
      {selected && <PromptDetail prompt={selected} />}
      <PromptEditor />
      <Dialogs />
    </div>
  );
}
