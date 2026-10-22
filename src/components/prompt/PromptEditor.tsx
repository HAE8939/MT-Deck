import { useEffect, useMemo, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  useApp,
  updateEditor,
  saveEditor,
  requestCloseEditor,
  addEditorImages,
  addEditorImageReference,
  removeEditorImage,
  moveEditorImage,
  makeEditorImagePrimary,
} from "../../store/store";
import { deriveFolders } from "../../store/store";
import { sanitizeFilename } from "../../services/promptParser";
import { MAX_PROMPT_IMAGES, isRemoteImageReference, resolvePromptImagePath } from "../../services/imageAssets";
import { XIcon, ImageIcon, ChevronLeftIcon, ChevronRightIcon } from "../common/icons";

/**
 * Structured prompt editor (spec §12). Ctrl+S saves; Esc asks before discarding.
 */
export function PromptEditor() {
  const app = useApp();
  const editor = app.editor;
  const titleRef = useRef<HTMLInputElement>(null);
  /** Hand-typed reference, staged in the input until “添加地址”. */
  const [manualRef, setManualRef] = useState("");

  useEffect(() => {
    if (editor) titleRef.current?.focus();
  }, [editor?.isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  // A different card means a different draft — never carry a half-typed path over.
  useEffect(() => {
    setManualRef("");
  }, [editor?.isNew, editor?.promptKey]);

  const folderOptions = useMemo(() => {
    const set = new Set<string>();
    for (const node of deriveFolders(app.prompts)) set.add(node.path);
    return [...set];
  }, [app.prompts]);

  if (!editor) return null;

  const targetFileName = editor.isNew
    ? `${sanitizeFilename(editor.title || "未命名")}.md`
    : (app.promptByKey[editor.promptKey ?? ""]?.fileName ?? "");

  const imagesFull = editor.images.length >= MAX_PROMPT_IMAGES;

  const submitManualRef = () => {
    if (!manualRef.trim()) return;
    addEditorImageReference(manualRef);
    setManualRef("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await saveEditor();
    // Keep the editor lifecycle explicit at the UI boundary. saveEditor also
    // clears the store after a successful write, while this handles any
    // successful save path that may be added later.
    if (result === "saved") requestCloseEditor();
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

          <div className="field">
            <div className="field-label-row">
              <label htmlFor="f-image-ref">图片</label>
              <span className="field-count">
                {editor.images.length} / {MAX_PROMPT_IMAGES}
              </span>
            </div>

            {editor.images.length > 0 && (
              <ul className="image-list" aria-label="已关联图片">
                {editor.images.map((ref, i) => {
                  const path = app.libraryRoot
                    ? resolvePromptImagePath(app.libraryRoot, ref)
                    : null;
                  const isRemote = isRemoteImageReference(ref);
                  return (
                    <li key={`${i}:${ref}`} className={`image-tile${i === 0 ? " is-primary" : ""}`}>
                      <div className="image-tile-media" title={ref}>
                        {path ? (
                          <img
                            src={convertFileSrc(path)}
                            alt={`配图 ${i + 1}`}
                            onError={(e) => {
                              e.currentTarget.closest(".image-tile-media")?.classList.add("is-broken");
                            }}
                          />
                        ) : (
                          <span className="image-tile-fallback">
                            <ImageIcon size={18} />
                            <span>{isRemote ? "远程地址" : "无本地文件"}</span>
                          </span>
                        )}
                        {i === 0 && <span className="image-tile-badge">封面</span>}
                      </div>
                      <div className="image-tile-actions">
                        {i > 0 ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-mini"
                            title="作为卡片封面与分享卡配图"
                            onClick={() => makeEditorImagePrimary(i)}
                          >
                            设为封面
                          </button>
                        ) : (
                          <span className="image-tile-placeholder">封面</span>
                        )}
                        <span className="image-tile-spacer" />
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={`前移第 ${i + 1} 张图片`}
                          title="前移"
                          disabled={i === 0}
                          onClick={() => moveEditorImage(i, -1)}
                        >
                          <ChevronLeftIcon size={14} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={`后移第 ${i + 1} 张图片`}
                          title="后移"
                          disabled={i === editor.images.length - 1}
                          onClick={() => moveEditorImage(i, 1)}
                        >
                          <ChevronRightIcon size={14} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-danger"
                          aria-label={`移除第 ${i + 1} 张图片`}
                          title="移除（资料库 src/ 中的文件保留）"
                          onClick={() => removeEditorImage(i)}
                        >
                          <XIcon size={14} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="image-row">
              <input
                id="f-image-ref"
                type="text"
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
                onKeyDown={(e) => {
                  // Enter stages the reference instead of submitting the form.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitManualRef();
                  }
                }}
                placeholder="src/example.png 或 http(s) 图片地址"
                spellCheck={false}
              />
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!manualRef.trim() || imagesFull}
                onClick={submitManualRef}
                title={imagesFull ? `最多 ${MAX_PROMPT_IMAGES} 张图片，先移除一张` : "把上面填写的地址加入图片列表"}
              >
                添加地址
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={imagesFull}
                onClick={() => void addEditorImages()}
                title={
                  imagesFull
                    ? `最多 ${MAX_PROMPT_IMAGES} 张图片，先移除一张`
                    : `可多选，最多再加 ${MAX_PROMPT_IMAGES - editor.images.length} 张，复制进资料库 src/`
                }
              >
                <ImageIcon size={15} />
                选择图片
              </button>
            </div>
            <div className="field-hint">
              {imagesFull
                ? `已达 ${MAX_PROMPT_IMAGES} 张上限，移除一张后可继续添加。`
                : "选中的图片会复制进资料库 src/，随库迁移不丢图；第一张作为卡片封面，其余在详情页查看。"}
            </div>
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
