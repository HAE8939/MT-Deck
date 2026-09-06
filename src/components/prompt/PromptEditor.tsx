import { useEffect, useMemo, useRef } from "react";
import {
  useApp,
  updateEditor,
  saveEditor,
  requestCloseEditor,
} from "../../store/store";
import { deriveFolders } from "../../store/store";
import { sanitizeFilename } from "../../services/promptParser";
import { XIcon } from "../common/icons";

/**
 * Structured prompt editor (spec §12). Ctrl+S saves; Esc asks before discarding.
 */
export function PromptEditor() {
  const app = useApp();
  const editor = app.editor;
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editor) titleRef.current?.focus();
  }, [editor?.isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  const folderOptions = useMemo(() => {
    const set = new Set<string>();
    for (const node of deriveFolders(app.prompts)) set.add(node.path);
    return [...set];
  }, [app.prompts]);

  if (!editor) return null;

  const targetFileName = editor.isNew
    ? `${sanitizeFilename(editor.title || "未命名")}.md`
    : (app.promptByKey[editor.promptKey ?? ""]?.fileName ?? "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void saveEditor();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="提示词编辑器">
      <form className="editor-panel" onSubmit={onSubmit}>
        <div className="editor-header">
          <h2 className="editor-title">{editor.isNew ? "新建提示词" : "编辑提示词"}</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="关闭编辑器"
            onClick={requestCloseEditor}
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="editor-form">
          <div className="field field-title">
            <label htmlFor="f-title">标题</label>
            <input
              id="f-title"
              ref={titleRef}
              type="text"
              value={editor.title}
              onChange={(e) => updateEditor({ title: e.target.value })}
              placeholder="提示词标题"
              required
            />
            <div className="field-hint">文件名：{targetFileName}</div>
          </div>

          <div className="field">
            <label htmlFor="f-folder">文件夹</label>
            <input
              id="f-folder"
              type="text"
              list="folder-options"
              value={editor.folder}
              onChange={(e) => updateEditor({ folder: e.target.value })}
              placeholder="例如 图片/GPT-Image"
              disabled={!editor.isNew}
            />
            <datalist id="folder-options">
              {folderOptions.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
            <div className="field-hint">
              {editor.isNew ? "文件夹即分类 —— 嵌套路径会自动创建。" : "如需更改文件夹，请在资源管理器中移动文件。"}
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="f-model">模型</label>
              <input
                id="f-model"
                type="text"
                value={editor.model}
                onChange={(e) => updateEditor({ model: e.target.value })}
                placeholder="例如 GPT-Image 2"
              />
            </div>
            <div className="field">
              <label htmlFor="f-tags">标签</label>
              <input
                id="f-tags"
                type="text"
                value={editor.tagsInput}
                onChange={(e) => updateEditor({ tagsInput: e.target.value })}
                placeholder="用英文逗号分隔"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="f-description">描述</label>
            <input
              id="f-description"
              type="text"
              value={editor.description}
              onChange={(e) => updateEditor({ description: e.target.value })}
              placeholder="这条提示词的用途"
            />
          </div>

          <div className="field field-prompt">
            <label htmlFor="f-prompt">提示词</label>
            <textarea
              id="f-prompt"
              value={editor.promptContent}
              onChange={(e) => updateEditor({ promptContent: e.target.value })}
              placeholder="提示词正文…"
              required
              spellCheck={false}
            />
          </div>

          <div className="field">
            <label htmlFor="f-notes">备注</label>
            <textarea
              id="f-notes"
              className="notes-area"
              value={editor.notes}
              onChange={(e) => updateEditor({ notes: e.target.value })}
              placeholder="可选：使用说明或限制"
            />
          </div>
        </div>

        <div className="editor-footer">
          <span className="editor-hint">Ctrl+S 保存 · Esc 关闭</span>
          <div className="editor-footer-actions">
            <button type="button" className="btn btn-ghost" onClick={requestCloseEditor}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              {editor.isNew ? "创建提示词" : "保存"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
