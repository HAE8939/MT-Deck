import { useEffect, useState } from "react";
import { useApp, selectPrompt, copyPrompt, exportShareCard, duplicatePrompt, openEditor, requestDelete, requestRename, revealFile, toggleFavorite } from "../../store/store";
import { XIcon, CopyIcon, EditIcon, TrashIcon, ExternalLinkIcon, StarIcon, EditIcon as RenameIcon, LayersIcon, ShareIcon, ImageIcon } from "../common/icons";
import type { Prompt } from "../../types/prompt";
import { convertFileSrc } from "@tauri-apps/api/core";
import { isRemoteImageReference, resolvePromptImagePath } from "../../services/imageAssets";

function formatDateTime(ms: number): string {
  if (!ms) return "";
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function PromptDetail({ prompt }: { prompt: Prompt }) {
  const app = useApp();
  const isFavorite = prompt.id !== null && app.favorites.includes(prompt.id);
  const images = prompt.images;
  /** Active slot in the viewer; index 0 is the cover (ISSUE-008). */
  const [active, setActive] = useState(0);
  /** References whose load failed, tracked per reference so one dead image
   *  never blanks out the whole strip. */
  const [failed, setFailed] = useState<string[]>([]);

  // The panel is reused when switching cards, so the viewer must not carry over
  // the previous card's slot or its load failures.
  useEffect(() => {
    setActive(0);
    setFailed([]);
  }, [prompt.key]);

  const index = images.length > 0 ? Math.min(active, images.length - 1) : 0;
  const current = images[index];
  const currentPath = app.libraryRoot ? resolvePromptImagePath(app.libraryRoot, current) : null;
  const currentFailed = !!current && failed.includes(current);
  const markFailed = (ref: string | undefined) => {
    if (!ref) return;
    setFailed((prev) => (prev.includes(ref) ? prev : [...prev, ref]));
  };

  return (
    <aside className="detail-panel" aria-label="提示词详情">
      <div className="detail-header">
        <button
          className="icon-btn detail-close"
          aria-label="关闭详情"
          title="关闭 (Esc)"
          onClick={() => selectPrompt(null)}
        >
          <XIcon size={16} />
        </button>
        <div className="detail-title-row">
          <h2 className="detail-title">{prompt.title}</h2>
          <button
            className={`icon-btn card-fav${isFavorite ? " is-active" : ""}`}
            aria-label={isFavorite ? "取消收藏" : "添加收藏"}
            onClick={() => toggleFavorite(prompt)}
            title={isFavorite ? "取消收藏" : "添加收藏"}
          >
            <StarIcon size={16} filled={isFavorite} />
          </button>
        </div>
        <div className="detail-meta">
          <span className="detail-path">{prompt.relativePath}</span>
          <span className="detail-date">{formatDateTime(prompt.modifiedAt)}</span>
        </div>
      </div>

      <div className="detail-actions">
        <button className="btn btn-primary" onClick={() => void copyPrompt(prompt)}>
          <CopyIcon size={15} />
          复制提示词
        </button>
        <button className="btn btn-ghost" onClick={() => openEditor(prompt)}>
          <EditIcon size={15} />
          编辑
        </button>
        <button className="btn btn-ghost" onClick={() => void duplicatePrompt(prompt)} title="创建一个新的 Markdown 副本">
          <LayersIcon size={15} />
          复制副本
        </button>
        <div className="detail-actions-secondary">
          <button className="icon-btn" title="导出分享卡 PNG（图文卡，自选保存位置）" aria-label="导出分享卡 PNG" onClick={() => void exportShareCard(prompt)}>
            <ShareIcon size={15} />
          </button>
          <button className="icon-btn" title="在文件夹中显示" aria-label="在文件夹中显示" onClick={() => void revealFile(prompt)}>
            <ExternalLinkIcon size={15} />
          </button>
          <button className="icon-btn" title="重命名文件" aria-label="重命名文件" onClick={() => requestRename(prompt)}>
            <RenameIcon size={15} />
          </button>
          <button className="icon-btn icon-btn-danger" title="删除（移入回收站）" aria-label="删除提示词" onClick={() => requestDelete(prompt)}>
            <TrashIcon size={15} />
          </button>
        </div>
      </div>

      <div className="detail-scroll">
        {(prompt.model || prompt.tags.length > 0) && (
          <div className="detail-tags">
            {prompt.model && <span className="card-model">{prompt.model}</span>}
            {prompt.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {prompt.description && <p className="detail-description">{prompt.description}</p>}
        <div className={`detail-media${currentFailed ? " is-error" : ""}`}>
          {currentPath && !currentFailed ? (
            <img
              className="detail-image"
              src={convertFileSrc(currentPath)}
              alt={`${prompt.title} 配图 ${index + 1}`}
              onError={() => markFailed(current)}
            />
          ) : (
            <div className="detail-media-placeholder">
              <span className="placeholder-hint">
                {current
                  ? isRemoteImageReference(current)
                    ? `第 ${index + 1} 张为远程地址，仅作记录，暂不作联网加载`
                    : `第 ${index + 1} 张图片未命中 · 点“编辑”重新选择，或把图片放进资料库的 src/ 文件夹`
                  : "暂无关联图片 · 点“编辑”→“选择图片”即可配图"}
              </span>
            </div>
          )}
          {images.length > 1 && (
            <span className="detail-media-count">
              {index + 1} / {images.length}
            </span>
          )}
        </div>

        {images.length > 1 && (
          <div className="detail-thumbs" aria-label="配图列表">
            {images.map((ref, i) => {
              const path = app.libraryRoot ? resolvePromptImagePath(app.libraryRoot, ref) : null;
              const isBroken = failed.includes(ref);
              return (
                <button
                  key={`${i}:${ref}`}
                  type="button"
                  className={`detail-thumb${i === index ? " is-active" : ""}${isBroken ? " is-broken" : ""}`}
                  aria-label={`查看第 ${i + 1} 张图片`}
                  aria-current={i === index ? "true" : undefined}
                  title={ref}
                  onClick={() => setActive(i)}
                >
                  {path && !isBroken ? (
                    <img src={convertFileSrc(path)} alt="" onError={() => markFailed(ref)} />
                  ) : (
                    <span className="detail-thumb-fallback">
                      {isBroken ? "!" : <ImageIcon size={14} />}
                    </span>
                  )}
                  <span className="detail-thumb-index">{i + 1}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="detail-body">
          <div className="detail-section-label">提示词</div>
          <div className="detail-prompt">{prompt.promptContent}</div>
          {prompt.notes && (
            <>
              <div className="detail-section-label">备注</div>
              <div className="detail-notes">{prompt.notes}</div>
            </>
          )}
        </div>
      </div>
      <div className="detail-file-hint">{prompt.fileName}</div>
    </aside>
  );
}
