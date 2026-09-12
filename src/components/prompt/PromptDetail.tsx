import { useApp, selectPrompt, copyPrompt, openEditor, requestDelete, requestRename, revealFile, toggleFavorite } from "../../store/store";
import { XIcon, CopyIcon, EditIcon, TrashIcon, ExternalLinkIcon, StarIcon, EditIcon as RenameIcon } from "../common/icons";
import type { Prompt } from "../../types/prompt";
import { convertFileSrc } from "@tauri-apps/api/core";

function formatDateTime(ms: number): string {
  if (!ms) return "";
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function PromptDetail({ prompt }: { prompt: Prompt }) {
  const app = useApp();
  const isFavorite = prompt.id !== null && app.favorites.includes(prompt.id);

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
        <div className="detail-actions-secondary">
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
      {prompt.image && app.libraryRoot && (() => {
        const imageRef = prompt.image.replace(/\\/g, "/");
        const imagePath = /^[A-Za-z]:\//.test(imageRef) || imageRef.startsWith("/")
          ? imageRef
          : `${app.libraryRoot.replace(/\\/g, "/")}/${imageRef.startsWith("scr/") ? imageRef : `scr/${imageRef}`}`;
        return <img className="detail-image" src={convertFileSrc(imagePath)} alt="" />;
      })()}

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
      <div className="detail-file-hint">{prompt.fileName}</div>
    </aside>
  );
}
