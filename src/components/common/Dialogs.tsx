import { useEffect, useRef, useState } from "react";
import {
  useApp,
  cancelConflict,
  clearRenaming,
  confirmRename,
} from "../../store/store";

/** Generic confirm dialog (delete, discard-changes, quit protection). */
export function ConfirmDialog() {
  const app = useApp();
  const confirm = app.confirm;
  if (!confirm) return null;
  return (
    <div className="modal-overlay modal-overlay-thin" role="alertdialog" aria-modal="true" aria-label={confirm.title}>
      <div className="dialog-panel">
        <h3 className="dialog-title">{confirm.title}</h3>
        <p className="dialog-message">{confirm.message}</p>
        <div className="dialog-actions">
          {confirm.actions.map((action) => (
            <button
              key={action.label}
              className={`btn ${
                action.variant === "primary"
                  ? "btn-primary"
                  : action.variant === "danger"
                    ? "btn-danger"
                    : "btn-ghost"
              }`}
              onClick={() => void action.run()}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** External-modification conflict dialog (spec §15): Reload / Cancel / Overwrite. */
export function ConflictDialog() {
  const app = useApp();
  const conflict = app.conflict;
  if (!conflict) return null;
  const overwrite = (): void => {
    void conflict.performSave();
  };
  const reload = (): void => {
    void conflict.reloadIntoEditor();
  };
  const cancel = (): void => {
    // Keep the editor open, do not touch the file.
    cancelConflict();
  };
  return (
    <div className="modal-overlay modal-overlay-thin" role="alertdialog" aria-modal="true" aria-label="检测到冲突">
      <div className="dialog-panel">
        <h3 className="dialog-title">检测到外部修改</h3>
        <p className="dialog-message">
          该提示词在 MT-Deck 之外被修改了。你想如何处理？
        </p>
        <div className="dialog-actions">
          <button className="btn btn-primary" onClick={reload}>
            重新加载外部修改
          </button>
          <button className="btn btn-ghost" onClick={cancel}>
            取消
          </button>
          <button className="btn btn-danger" onClick={overwrite}>
            覆盖外部修改
          </button>
        </div>
      </div>
    </div>
  );
}

/** Rename-file dialog (explicit, separate from editing the title — spec §19). */
export function RenameDialog() {
  const app = useApp();
  const prompt = app.renaming;
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prompt) {
      setValue(prompt.fileName.replace(/\.(md|markdown)$/i, ""));
      // Focus after paint.
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [prompt]);

  if (!prompt) return null;
  const submit = (): void => {
    void confirmRename(value);
  };
  return (
    <div className="modal-overlay modal-overlay-thin" role="dialog" aria-modal="true" aria-label="重命名文件">
      <div className="dialog-panel">
        <h3 className="dialog-title">重命名文件</h3>
        <p className="dialog-message">只修改物理文件名 —— 提示词标题和 ID 保持不变。</p>
        <input
          ref={inputRef}
          className="dialog-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          spellCheck={false}
        />
        <div className="dialog-actions">
          <button className="btn btn-primary" onClick={submit}>
            重命名
          </button>
          <button className="btn btn-ghost" onClick={clearRenaming}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

export function Toast() {
  const app = useApp();
  if (!app.toast) return null;
  return (
    <div className="toast" key={app.toast.key} role="status">
      {app.toast.text}
    </div>
  );
}

export function Dialogs() {
  return (
    <>
      <ConfirmDialog />
      <ConflictDialog />
      <RenameDialog />
      <Toast />
    </>
  );
}
