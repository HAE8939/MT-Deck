import { useApp, selectPrompt, toggleFavorite } from "../../store/store";
import { StarIcon } from "../common/icons";
import type { Prompt } from "../../types/prompt";

export function PromptCard({
  prompt,
  index,
  focused,
  onFocus,
}: {
  prompt: Prompt;
  index: number;
  focused: boolean;
  onFocus: () => void;
}) {
  const app = useApp();
  const isFavorite = prompt.id !== null && app.favorites.includes(prompt.id);

  return (
    <article
      className={`prompt-card${focused ? " is-focused" : ""}`}
      style={{ "--stagger-i": index } as React.CSSProperties}
      role="listitem"
      tabIndex={0}
      aria-label={prompt.title}
      onClick={() => selectPrompt(prompt.key)}
      onFocus={onFocus}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.target as HTMLElement).classList.contains("prompt-card")) {
          selectPrompt(prompt.key);
        }
      }}
    >
      <div className="card-top">
        <h3 className="card-title">{prompt.title}</h3>
        <button
          className={`icon-btn card-fav${isFavorite ? " is-active" : ""}`}
          aria-label={isFavorite ? "取消收藏" : "添加收藏"}
          aria-pressed={isFavorite}
          title={isFavorite ? "取消收藏" : "添加收藏"}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(prompt);
          }}
        >
          <StarIcon size={15} filled={isFavorite} />
        </button>
      </div>
      {prompt.description && <p className="card-desc">{prompt.description}</p>}
      <p className="card-preview">{prompt.promptContent.slice(0, 160)}</p>
      <div className="card-meta">
        {prompt.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
        {prompt.model && <span className="card-model">{prompt.model}</span>}
        {prompt.tags.length > 3 && <span className="card-more">+{prompt.tags.length - 3}</span>}
      </div>
    </article>
  );
}
