import assert from "node:assert/strict";
import test from "node:test";
import { parsePromptMarkdown, serializePromptMarkdown } from "../src/services/promptParser.ts";
import {
  MAX_PROMPT_IMAGES,
  addImages,
  makeImagePrimary,
  moveImage,
  normalizeImageRefs,
  removeImageAt,
  sameImageList,
} from "../src/services/imageAssets.ts";

const card = (...frontmatter: string[]) =>
  ["---", ...frontmatter, "---", "", "# Prompt", "", "body"].join("\n");

test("reads an images list in order, first entry is the cover", () => {
  const parsed = parsePromptMarkdown(
    card("title: T", "images:", "  - src/a.png", "  - src/b.png", "  - src/c.png")
  );
  assert.deepEqual(parsed.images, ["src/a.png", "src/b.png", "src/c.png"]);
  assert.deepEqual(parsed.extra, []);
});

test("legacy single image scalar becomes a one-entry list", () => {
  const parsed = parsePromptMarkdown(card("title: T", "image: src/only.png"));
  assert.deepEqual(parsed.images, ["src/only.png"]);
  assert.deepEqual(parsed.extra, []);
});

test("images wins over a stale image key and neither leaks into extra", () => {
  const parsed = parsePromptMarkdown(
    card("title: T", "image: src/legacy.png", "images:", "  - src/new.png")
  );
  assert.deepEqual(parsed.images, ["src/new.png"]);
  assert.deepEqual(parsed.extra, []);
});

test("empty images key means no images", () => {
  assert.deepEqual(parsePromptMarkdown(card("title: T", "images:")).images, []);
  assert.deepEqual(parsePromptMarkdown(card("title: T", "image:")).images, []);
});

test("unknown frontmatter still survives next to images", () => {
  const parsed = parsePromptMarkdown(card("title: T", "images:", "  - src/a.png", "author: HAE"));
  assert.deepEqual(parsed.images, ["src/a.png"]);
  assert.deepEqual(parsed.extra, [["author", "HAE"]]);
});

test("a hand-edited list beyond the cap is read in full, not silently truncated", () => {
  const nine = Array.from({ length: 9 }, (_, i) => `  - src/${i + 1}.png`);
  const parsed = parsePromptMarkdown(card("title: T", "images:", ...nine));
  assert.equal(parsed.images.length, 9);
});

test("serialization writes a list, quotes remote references, and drops the legacy key", () => {
  const output = serializePromptMarkdown({
    id: "x",
    title: "T",
    tags: [],
    images: ["src/a.png", "https://cdn.example.com/b.png"],
    promptContent: "body",
    extra: [],
  });
  assert.match(output, /images:\n  - src\/a\.png\n  - "https:\/\/cdn\.example\.com\/b\.png"/);
  assert.doesNotMatch(output, /^image: /m);
  // Reading it back must reproduce both entries verbatim.
  assert.deepEqual(parsePromptMarkdown(output).images, [
    "src/a.png",
    "https://cdn.example.com/b.png",
  ]);
});

test("no images means no images key at all", () => {
  const output = serializePromptMarkdown({
    id: "x",
    title: "T",
    tags: [],
    images: [],
    promptContent: "body",
    extra: [],
  });
  assert.doesNotMatch(output, /images:/);
});

test("a full round trip keeps up to the cap of images in order", () => {
  const refs = Array.from({ length: MAX_PROMPT_IMAGES }, (_, i) => `src/图 ${i + 1}.png`);
  const output = serializePromptMarkdown({
    id: "x",
    title: "T",
    tags: ["a"],
    images: refs,
    promptContent: "body",
    extra: [],
  });
  assert.deepEqual(parsePromptMarkdown(output).images, refs);
});

test("addImages honours the cap, dedupes and reports the rejects", () => {
  assert.equal(MAX_PROMPT_IMAGES, 8);
  const base = ["src/a.png"];
  const first = addImages(base, ["src/b.png", "src/a.png", "  ", "src/c.png"]);
  assert.deepEqual(first.images, ["src/a.png", "src/b.png", "src/c.png"]);
  assert.equal(first.added, 2);
  assert.equal(first.dropped, 0);

  const full = Array.from({ length: 7 }, (_, i) => `src/${i}.png`);
  const second = addImages(full, ["src/7.png", "src/8.png", "src/9.png"]);
  assert.equal(second.images.length, 8);
  assert.equal(second.added, 1);
  assert.equal(second.dropped, 2);
  assert.equal(second.images[7], "src/7.png");
});

test("reorder helpers keep the remaining sequence intact", () => {
  const list = ["src/a.png", "src/b.png", "src/c.png", "src/d.png"];
  assert.deepEqual(removeImageAt(list, 1), ["src/a.png", "src/c.png", "src/d.png"]);
  assert.deepEqual(removeImageAt(list, 9), list);
  assert.deepEqual(moveImage(list, 0, 1), ["src/b.png", "src/a.png", "src/c.png", "src/d.png"]);
  assert.deepEqual(moveImage(list, 0, -1), list);
  assert.deepEqual(makeImagePrimary(list, 2), ["src/c.png", "src/a.png", "src/b.png", "src/d.png"]);
  assert.deepEqual(makeImagePrimary(list, 0), list);
});

test("normalize and compare helpers back the editor dirty check", () => {
  assert.deepEqual(normalizeImageRefs([" src/a.png ", "", undefined, "src/a.png"]), ["src/a.png"]);
  assert.equal(sameImageList(["a", "b"], ["a", "b"]), true);
  assert.equal(sameImageList(["a", "b"], ["b", "a"]), false);
  assert.equal(sameImageList(["a"], ["a", "b"]), false);
});
