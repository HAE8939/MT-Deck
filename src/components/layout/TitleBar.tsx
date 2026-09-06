import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * Custom title bar for the borderless (decorations:false) window.
 * Left area is a drag region (double-click toggles maximize); right area has
 * minimize / maximize-restore / close. Close calls window.close() so the Rust
 * CloseRequested guard (unsaved-editor confirmation) still runs.
 */
export function TitleBar() {
  const win = getCurrentWindow();
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let disposed = false;

    win
      .isMaximized()
      .then((m) => !disposed && setMaximized(m))
      .catch(() => undefined);

    void win
      .onResized(() => {
        win
          .isMaximized()
          .then(setMaximized)
          .catch(() => undefined);
      })
      .then((fn) => {
        if (disposed) fn();
        else unlisten = fn;
      });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [win]);

  return (
    <div className="titlebar">
      <div
        className="titlebar-drag"
        data-tauri-drag-region
        onDoubleClick={() => void win.toggleMaximize()}
      >
        <span className="titlebar-title">MT-Deck</span>
      </div>
      <div className="titlebar-controls">
        <button
          type="button"
          className="tb-btn"
          title="最小化"
          aria-label="最小化"
          onClick={() => void win.minimize()}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
            <path d="M1 5.5h9" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button
          type="button"
          className="tb-btn"
          title={maximized ? "还原" : "最大化"}
          aria-label={maximized ? "还原" : "最大化"}
          onClick={() => void win.toggleMaximize()}
        >
          {maximized ? (
            <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="1" y="3" width="6.5" height="6.5" />
                <path d="M3.2 3V1.6a.6.6 0 0 1 .6-.6h5.6a.6.6 0 0 1 .6.6v5.6a.6.6 0 0 1-.6.6H8" />
              </g>
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
              <rect x="1.5" y="1.5" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          )}
        </button>
        <button
          type="button"
          className="tb-btn tb-close"
          title="关闭"
          aria-label="关闭"
          onClick={() => void win.close()}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
            <path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
