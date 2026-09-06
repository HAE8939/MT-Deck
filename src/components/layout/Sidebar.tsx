import type { ReactNode } from "react";
import { useApp, setNav, setTheme, changeLibrary, type Nav } from "../../store/store";
import { deriveFolders, deriveModels, deriveTags } from "../../store/store";
import { FolderIcon, StarIcon, ClockIcon, SunIcon, MoonIcon, MonitorIcon } from "../common/icons";
import { Logo } from "../common/Logo";
import type { ThemeMode } from "../../types/prompt";

function NavButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button className={`side-item${active ? " is-active" : ""}`} onClick={onClick}>
      {icon && <span className="side-item-icon">{icon}</span>}
      <span className="side-item-label">{label}</span>
      {count !== undefined && <span className="side-item-count">{count}</span>}
    </button>
  );
}

function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="side-section">
      <div className="side-section-title">{title}</div>
      {children}
    </div>
  );
}

export function Sidebar() {
  const app = useApp();
  const prompts = app.prompts;
  const folders = deriveFolders(prompts);
  const tags = deriveTags(prompts);
  const models = deriveModels(prompts);
  const favoriteCount = prompts.filter((p) => p.id && app.favorites.includes(p.id)).length;

  const isNavActive = (nav: Nav): boolean => {
    if (nav.kind !== app.nav.kind) return false;
    if ("value" in nav && "value" in app.nav) return nav.value === app.nav.value;
    return "value" in nav === "value" in app.nav;
  };

  return (
    <aside className="sidebar">
      <div className="side-brand">
        <div className="brand-lockup">
          <Logo size={18} className="brand-logo" />
          <span className="wordmark wordmark-small">MT-Deck</span>
        </div>
        <div className="side-library-row">
          <div className="side-library-name" title={app.libraryRoot ?? undefined}>
            {app.libraryName}
          </div>
          <button
            className="icon-btn side-library-change"
            title="更改资料库目录"
            aria-label="更改资料库目录"
            onClick={() => void changeLibrary()}
          >
            <FolderIcon size={14} />
          </button>
        </div>
      </div>

      <nav className="side-nav" aria-label="资料库">
        <NavButton
          active={isNavActive({ kind: "all" })}
          onClick={() => setNav({ kind: "all" })}
          label="全部提示词"
          count={prompts.length}
        />
        <NavButton
          active={isNavActive({ kind: "favorites" })}
          onClick={() => setNav({ kind: "favorites" })}
          icon={<StarIcon size={15} filled={app.nav.kind === "favorites"} />}
          label="收藏"
          count={favoriteCount}
        />
        <NavButton
          active={isNavActive({ kind: "recent" })}
          onClick={() => setNav({ kind: "recent" })}
          icon={<ClockIcon size={15} />}
          label="最近使用"
        />
      </nav>

      {folders.length > 0 && (
        <SidebarSection title="文件夹">
          <div className="side-tree">
            {folders.map((f) => (
              <button
                key={f.path}
                className={`side-item side-folder${isNavActive({ kind: "folder", value: f.path }) ? " is-active" : ""}`}
                style={{ paddingLeft: 12 + f.depth * 14 }}
                onClick={() => setNav({ kind: "folder", value: f.path })}
                title={f.path}
              >
                <span className="side-item-icon">
                  <FolderIcon size={15} />
                </span>
                <span className="side-item-label">{f.name}</span>
                <span className="side-item-count">{f.count}</span>
              </button>
            ))}
          </div>
        </SidebarSection>
      )}

      {tags.length > 0 && (
        <SidebarSection title="标签">
          <div className="side-chips">
            {tags.slice(0, 24).map((t) => (
              <button
                key={t.tag}
                className={`chip${isNavActive({ kind: "tag", value: t.tag }) ? " is-active" : ""}`}
                onClick={() => setNav({ kind: "tag", value: t.tag })}
              >
                {t.tag}
                <span className="chip-count">{t.count}</span>
              </button>
            ))}
          </div>
        </SidebarSection>
      )}

      {models.length > 0 && (
        <SidebarSection title="模型">
          <div className="side-chips">
            {models.slice(0, 16).map((m) => (
              <button
                key={m.model}
                className={`chip${isNavActive({ kind: "model", value: m.model }) ? " is-active" : ""}`}
                onClick={() => setNav({ kind: "model", value: m.model })}
              >
                {m.model}
                <span className="chip-count">{m.count}</span>
              </button>
            ))}
          </div>
        </SidebarSection>
      )}

      <div className="side-footer">
        <div className="theme-toggle" role="group" aria-label="主题">
          {(
            [
              ["light", <SunIcon key="l" size={14} />],
              ["dark", <MoonIcon key="d" size={14} />],
              ["system", <MonitorIcon key="s" size={14} />],
            ] as Array<[ThemeMode, ReactNode]>
          ).map(([mode, icon]) => (
            <button
              key={mode}
              className={`theme-toggle-btn${app.theme === mode ? " is-active" : ""}`}
              onClick={() => setTheme(mode)}
              aria-pressed={app.theme === mode}
              title={
                mode === "light" ? "浅色主题" : mode === "dark" ? "深色主题" : "跟随系统主题"
              }
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
