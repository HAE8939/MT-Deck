import { useCallback, useEffect, useRef, useState } from "react";
import { chooseLibraryFolder, completeOnboarding, createNewLibrary } from "../../store/store";
import { Logo } from "../common/Logo";

/** Staggered draw-in delay for one line-art element. */
const d = (i: number) => ({ "--d": `${160 + i * 110}ms` } as React.CSSProperties);

type Phrase = { t: string; nudge?: number };

type ObPage = {
  /** Phrases render as nowrap spans so line breaks only happen between them. */
  title: Phrase[];
  body: string;
  art: React.ReactNode;
};

const pages: ObPage[] = [
  {
    title: [{ t: "你的 AI 创作资产，" }, { t: "值得被好好保存。" }],
    body: "Prompt 与 Image，一起留在你的本地资产库。",
    art: (
      <svg className="ob-svg" viewBox="70 40 340 315" aria-hidden="true">
        <rect className="ob-d ob-b" pathLength={1} style={d(0)} x="120" y="52" width="240" height="176" rx="4" />
        <path className="ob-d ob-g" pathLength={1} style={d(2)} d="M138 210 L196 148 L238 190 L272 156 L342 224" />
        <circle className="ob-d ob-g" pathLength={1} style={d(3)} cx="170" cy="96" r="14" />
        <path className="ob-d ob-k" pathLength={1} style={d(4)} d="M120 258 H300" />
        <path className="ob-d ob-k" pathLength={1} style={d(5)} d="M120 278 H228" />
        <rect className="ob-f" style={d(6)} x="120" y="296" width="64" height="20" rx="3" fill="var(--color-accent-brass-soft)" />
        <rect className="ob-f" style={d(7)} x="192" y="296" width="44" height="20" rx="3" fill="var(--color-surface)" stroke="var(--color-hairline)" />
        <text className="ob-t" x="240" y="344" textAnchor="middle">Prompt + Image</text>
      </svg>
    ),
  },
  {
    title: [{ t: "Prompt，", nudge: -5 }, { t: "不只是文字。" }],
    body: "参考图、效果图和创作经验，都是理解它的一部分。",
    art: (
      <svg className="ob-svg" viewBox="70 40 340 315" aria-hidden="true">
        <g transform="rotate(-7 240 180)">
          <rect className="ob-d ob-g" pathLength={1} style={d(0)} x="150" y="84" width="200" height="150" rx="4" />
          <path className="ob-d ob-g" pathLength={1} style={d(2)} d="M164 210 L212 158 L246 192 L276 162 L338 220" />
        </g>
        <g transform="rotate(5 240 180)">
          <rect className="ob-d ob-b" pathLength={1} style={d(3)} x="140" y="96" width="210" height="150" rx="4" />
          <path className="ob-d ob-b" pathLength={1} style={d(5)} d="M156 128 H240 M156 148 H204" />
        </g>
        <rect className="ob-d ob-k" pathLength={1} style={d(6)} x="130" y="108" width="220" height="150" rx="4" />
        <path className="ob-d ob-k" pathLength={1} style={d(8)} d="M150 138 H306" />
        <path className="ob-d ob-k" pathLength={1} style={d(9)} d="M150 160 H334" />
        <path className="ob-d ob-k" pathLength={1} style={d(10)} d="M150 182 H282" />
        <rect className="ob-f" style={d(11)} x="150" y="212" width="56" height="18" rx="3" fill="var(--color-accent-brass-soft)" />
        <text className="ob-t" x="240" y="344" textAnchor="middle">Prompt + Reference</text>
      </svg>
    ),
  },
  {
    title: [{ t: "你的数据，" }, { t: "始终属于你。" }],
    body: "本地 · Markdown · 无账号 · 无云端。",
    art: (
      <svg className="ob-svg" viewBox="70 40 340 315" aria-hidden="true">
        <path className="ob-d ob-b" pathLength={1} style={d(0)} d="M96 136 v-18 h58 l14 18" />
        <rect className="ob-d ob-b" pathLength={1} style={d(1)} x="96" y="136" width="196" height="128" rx="4" />
        <rect className="ob-d ob-g" pathLength={1} style={d(3)} x="118" y="164" width="40" height="54" rx="2" />
        <rect className="ob-d ob-g" pathLength={1} style={d(4)} x="174" y="164" width="40" height="54" rx="2" />
        <rect className="ob-d ob-g" pathLength={1} style={d(5)} x="230" y="164" width="40" height="54" rx="2" />
        <path className="ob-d ob-g" pathLength={1} style={d(6)} d="M126 180 h24 M126 190 h24 M126 200 h14" />
        <path className="ob-d ob-g" pathLength={1} style={d(7)} d="M182 180 h24 M182 190 h24 M182 200 h14" />
        <path className="ob-d ob-g" pathLength={1} style={d(8)} d="M238 180 h24 M238 190 h24 M238 200 h14" />
        <path className="ob-d ob-k" pathLength={1} style={d(9)} d="M80 292 H308" />
        <path className="ob-d ob-k" pathLength={1} style={d(10)} d="M318 92 a14 14 0 1 1 13 -21 a18 18 0 0 1 34 5 a12 12 0 1 1 2 16 Z" />
        <path className="ob-d ob-b" pathLength={1} style={d(12)} d="M302 112 L388 66" />
        <text className="ob-t" x="240" y="344" textAnchor="middle">Local  /  Markdown  /  No Cloud</text>
      </svg>
    ),
  },
  {
    title: [{ t: "找到它。" }, { t: "复制它。" }, { t: "继续创造。" }],
    body: "搜索、理解、复用，让下一次创作从已有资产开始。",
    art: (
      <svg className="ob-svg" viewBox="70 40 340 315" aria-hidden="true">
        <rect className="ob-d ob-b" pathLength={1} style={d(0)} x="90" y="84" width="300" height="38" rx="19" />
        <circle className="ob-d ob-k" pathLength={1} style={d(2)} cx="116" cy="103" r="8" />
        <path className="ob-d ob-k" pathLength={1} style={d(2)} d="M122 109 L129 116" />
        <path className="ob-d ob-k" pathLength={1} style={d(3)} d="M142 103 H238" />
        <rect className="ob-f" style={d(5)} x="90" y="144" width="300" height="42" rx="4" fill="var(--color-accent-brass-soft)" />
        <rect className="ob-d ob-k" pathLength={1} style={d(5)} x="90" y="144" width="300" height="42" rx="4" />
        <path className="ob-d ob-k" pathLength={1} style={d(6)} d="M106 159 H252 M106 173 H208" />
        <rect className="ob-d ob-k" pathLength={1} style={d(7)} x="90" y="198" width="300" height="42" rx="4" />
        <path className="ob-d ob-k" pathLength={1} style={d(8)} d="M106 213 H238 M106 227 H198" />
        <rect className="ob-d ob-g" pathLength={1} style={d(9)} x="332" y="252" width="34" height="40" rx="3" />
        <rect className="ob-d ob-g" pathLength={1} style={d(10)} x="322" y="262" width="34" height="40" rx="3" />
        <text className="ob-t" x="240" y="344" textAnchor="middle">Search  →  Find  →  Copy  →  Create</text>
      </svg>
    ),
  },
];

export function FirstLaunch({ mode = "setup" }: { mode?: "setup" | "onboarding" }) {
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const pageRef = useRef(0);
  pageRef.current = page;

  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(pages.length - 1, next));
    if (clamped === pageRef.current) return;
    setDir(clamped > pageRef.current ? 1 : -1);
    setPage(clamped);
  }, []);

  useEffect(() => {
    if (mode !== "onboarding") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") goTo(pageRef.current + 1);
      if (event.key === "ArrowLeft") goTo(pageRef.current - 1);
      if (event.key === "Escape") completeOnboarding();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, goTo]);

  if (mode === "setup") {
    return (
      <div className="first-launch first-launch-setup">
        <div className="first-launch-card">
          <Logo size={72} className="first-launch-logo" title="MT-Deck" />
          <h1 className="wordmark">MT-Deck</h1>
          <p className="first-launch-tagline">你的本地 AI 创作资产库。</p>
          <p className="first-launch-sub">Prompt、图片和 Markdown，都保存在你自己的电脑上。</p>
          <div className="first-launch-actions">
            <button className="btn btn-primary" onClick={() => void chooseLibraryFolder()}>选择提示词文件夹</button>
            <span className="first-launch-or">或</span>
            <button className="btn btn-ghost" onClick={() => void createNewLibrary()}>新建提示词库</button>
          </div>
        </div>
      </div>
    );
  }

  const current = pages[page];

  return (
    <div
      className="onboarding"
      role="dialog"
      aria-modal="true"
      aria-label="MT-Deck 新手引导"
    >
      <button className="onboarding-skip" onClick={() => completeOnboarding()}>跳过</button>
      <div className="onboarding-stage">
        <div className="onboarding-art" aria-hidden="true">
          <div className="ob-enter" key={`art-${page}`} style={{ "--dir": dir } as React.CSSProperties}>
            {current.art}
          </div>
        </div>
        <div className="onboarding-copy">
          <div className="ob-enter" key={`copy-${page}`} style={{ "--dir": dir } as React.CSSProperties}>
            <h1>{current.title.map((p) => <span key={p.t} style={p.nudge ? { transform: `translateY(${p.nudge}px)` } : undefined}>{p.t}</span>)}</h1>
            <p>{current.body}</p>
          </div>
        </div>
      </div>
      <div className="onboarding-footer">
        <div className="onboarding-indicator" aria-label={`第 ${page + 1} 页，共 ${pages.length} 页`}>
          {pages.map((_, index) => (
            <button
              key={index}
              className={index === page ? "is-active" : ""}
              aria-label={`第 ${index + 1} 页`}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
        {page === pages.length - 1 ? (
          <button className="btn btn-primary" onClick={() => completeOnboarding()}>开始使用 MT-Deck</button>
        ) : (
          <button className="btn btn-primary" onClick={() => goTo(page + 1)}>继续</button>
        )}
      </div>
    </div>
  );
}
