import assert from "node:assert/strict";
import test from "node:test";
import { buildPrompt, serializePromptMarkdown } from "../src/services/promptParser.ts";

test("duplicate serialization preserves images, content, and unknown frontmatter with a new id", () => {
  const source = buildPrompt("C:/Library/Image/source.md", "Image/source.md", [
    "---", "id: old-id", "title: Source", "image: src/result.png", "author: HAE", "tags:", "  - Interior", "---", "", "# Prompt", "", "a room", "", "# Notes", "", "keep this"
  ].join("\n"), 1);
  // Legacy single `image:` is read as a one-entry list (ISSUE-008 compatibility).
  assert.deepEqual(source.images, ["src/result.png"]);
  const output = serializePromptMarkdown({
    id: "new-id",
    title: `${source.title} 副本`,
    model: source.model,
    tags: source.tags,
    description: source.description,
    images: source.images,
    promptContent: source.promptContent,
    notes: source.notes,
    extra: source.extraFrontmatter,
  });
  assert.match(output, /id: new-id/);
  assert.match(output, /images:\n  - src\/result\.png/);
  assert.doesNotMatch(output, /^image: /m);
  assert.match(output, /author: HAE/);
  assert.match(output, /a room/);
  assert.doesNotMatch(output, /id: old-id/);
});
