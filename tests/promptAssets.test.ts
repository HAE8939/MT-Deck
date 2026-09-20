import assert from "node:assert/strict";
import test from "node:test";
import { isRemoteImageReference, resolvePromptImagePath } from "../src/services/imageAssets.ts";

test("resolves bare image references beneath library src", () => {
  assert.equal(resolvePromptImagePath("C:/Library", "example.png"), "C:/Library/src/example.png");
});

test("keeps explicit src references relative to the library", () => {
  assert.equal(resolvePromptImagePath("C:/Library", "src/example.png"), "C:/Library/src/example.png");
});

test("keeps absolute local references unchanged", () => {
  assert.equal(resolvePromptImagePath("C:/Library", "D:\\Images\\example.png"), "D:/Images/example.png");
});

test("returns null for absent and remote image references", () => {
  assert.equal(resolvePromptImagePath("C:/Library"), null);
  assert.equal(resolvePromptImagePath("C:/Library", "https://example.com/a.png"), null);
  assert.equal(isRemoteImageReference("HTTP://example.com/a.png"), true);
  assert.equal(isRemoteImageReference("src/a.png"), false);
});
