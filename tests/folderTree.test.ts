import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleFolders } from "../src/components/layout/folderTree.ts";

const folders = [
  { name: "Image", path: "Image", depth: 0, count: 2 },
  { name: "GPT-image", path: "Image/GPT-image", depth: 1, count: 1 },
  { name: "Video", path: "Video", depth: 0, count: 5 },
  { name: "Kling", path: "Video/Kling", depth: 1, count: 3 },
];

test("collapsing a folder hides only its descendants", () => {
  assert.deepEqual(
    getVisibleFolders(folders, new Set(["Image"])).map((folder) => folder.path),
    ["Image", "Video", "Video/Kling"]
  );
});

test("expanding a folder restores its descendants", () => {
  assert.deepEqual(
    getVisibleFolders(folders, new Set()).map((folder) => folder.path),
    ["Image", "Image/GPT-image", "Video", "Video/Kling"]
  );
});

