export function isRemoteImageReference(image?: string): boolean {
  return /^https?:\/\//i.test(image?.trim() ?? "");
}

/** Resolves a local image reference relative to the library root. */
export function resolvePromptImagePath(libraryRoot: string, image?: string): string | null {
  const value = image?.trim();
  if (!value || isRemoteImageReference(value)) return null;
  const normalized = value.replace(/\\/g, "/");
  if (/^[A-Za-z]:\//.test(normalized) || normalized.startsWith("/")) return normalized;
  const relative = normalized.startsWith("src/") ? normalized : `src/${normalized}`;
  return `${libraryRoot.replace(/\\/g, "/").replace(/\/$/, "")}/${relative}`;
}
