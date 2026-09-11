export interface NewPromptSaveActions {
  closeEditor: () => void;
  refreshPrompt: () => Promise<string | null>;
  selectPrompt: (key: string | null) => void;
}

export async function finishNewPromptSave(actions: NewPromptSaveActions): Promise<void> {
  actions.closeEditor();
  const savedKey = await actions.refreshPrompt();
  actions.selectPrompt(savedKey);
}
