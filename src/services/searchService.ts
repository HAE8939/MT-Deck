import MiniSearch from "minisearch";
import type { Prompt } from "../types/prompt";

/** Tokenizer with CJK support: whitespace/punctuation split + character bigrams for CJK runs. */
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  for (const word of text.toLowerCase().split(/[\s\p{P}\p{S}]+/u)) {
    if (!word) continue;
    if (/[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff]/.test(word)) {
      for (let i = 0; i < word.length; i++) {
        tokens.push(word[i]);
        if (i < word.length - 1) tokens.push(word.slice(i, i + 2));
      }
    } else {
      tokens.push(word);
    }
  }
  return tokens;
}

function createIndex(): MiniSearch<Doc> {
  return new MiniSearch<Doc>({
    idField: "key",
    fields: ["title", "description", "model", "tags", "promptContent", "notes"],
    tokenize,
    processTerm: (term) => term,
  });
}

interface Doc {
  key: string;
  title: string;
  description: string;
  model: string;
  tags: string[];
  promptContent: string;
  notes: string;
}

function toDoc(p: Prompt): Doc {
  return {
    key: p.key,
    title: p.title,
    description: p.description ?? "",
    model: p.model ?? "",
    tags: p.tags,
    promptContent: p.promptContent,
    notes: p.notes ?? "",
  };
}

class SearchService {
  private index = createIndex();

  rebuild(prompts: Prompt[]): void {
    this.index = createIndex();
    this.index.addAll(prompts.map(toDoc));
  }

  upsert(prompt: Prompt): void {
    this.index.discard(prompt.key);
    this.index.add(toDoc(prompt));
  }

  remove(key: string): void {
    this.index.discard(key);
  }

  /** Returns matching keys ordered by relevance, or null for an empty query. */
  search(query: string): string[] | null {
    const q = query.trim();
    if (!q) return null;
    return this.index
      .search(q, {
        prefix: true,
        fuzzy: 0.2,
        boost: { title: 3, tags: 2, description: 1.5, model: 1.5 },
      })
      .map((r) => String(r.id));
  }
}

export const searchService = new SearchService();
