import type { FolderNode } from "../../store/store";

export function getVisibleFolders(
  folders: FolderNode[],
  collapsedPaths: ReadonlySet<string>
): FolderNode[] {
  const visible: FolderNode[] = [];
  let hiddenDepth = -1;

  for (const folder of folders) {
    if (hiddenDepth >= 0) {
      if (folder.depth > hiddenDepth) continue;
      hiddenDepth = -1;
    }

    visible.push(folder);
    if (collapsedPaths.has(folder.path)) hiddenDepth = folder.depth;
  }

  return visible;
}
