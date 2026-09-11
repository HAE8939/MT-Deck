import assert from "node:assert/strict";
import test from "node:test";
import { finishNewPromptSave } from "../src/store/editorTransitions.ts";

test("new prompt save closes the editor before refreshing the saved prompt", async () => {
  const events: string[] = [];

  await finishNewPromptSave({
    closeEditor: () => events.push("closed"),
    refreshPrompt: async () => {
      events.push("refreshed");
      return "id:created";
    },
    selectPrompt: (key) => events.push(`selected:${key}`),
  });

  assert.deepEqual(events, ["closed", "refreshed", "selected:id:created"]);
});
