/** Card image helpers (ISSUE-003 → ISSUE-008 multi-image). */

/**
 * Hard cap per card (ISSUE-008). Enforced on the *add* path only — a hand-edited
 * frontmatter list with more entries is still read and displayed in full, because
 * silently dropping user data during a scan would be worse than an over-long strip.
 */
export const MAX_PROMPT_IMAGES = 8;

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

/** Trims, drops blanks and repeats, keeping the order of first occurrences. */
export function normalizeImageRefs(
  refs: readonly (string | undefined)[] | undefined
): string[] {
  const out: string[] = [];
  for (const ref of refs ?? []) {
    const value = ref?.trim();
    if (value && !out.includes(value)) out.push(value);
  }
  return out;
}

/**
 * Appends new references, skipping repeats and honouring the cap.
 * `dropped` counts cap rejects only — a reference that is already on the card is
 * a no-op, not something the user should be warned about.
 */
export function addImages(
  current: readonly string[],
  incoming: readonly string[],
  limit: number = MAX_PROMPT_IMAGES
): { images: string[]; added: number; dropped: number } {
  const images = normalizeImageRefs(current);
  const before = images.length;
  let dropped = 0;
  for (const ref of normalizeImageRefs(incoming)) {
    if (images.includes(ref)) continue;
    if (images.length >= limit) {
      dropped += 1;
      continue;
    }
    images.push(ref);
  }
  return { images, added: images.length - before, dropped };
}

/** Removes one entry by index; the remaining order is untouched. */
export function removeImageAt(current: readonly string[], index: number): string[] {
  if (index < 0 || index >= current.length) return [...current];
  return current.filter((_, i) => i !== index);
}

/** Shifts one entry by `delta` positions (−1 = 前移 / +1 = 后移), clamped to the list. */
export function moveImage(current: readonly string[], index: number, delta: number): string[] {
  const images = [...current];
  const target = index + delta;
  if (index < 0 || index >= images.length || target < 0 || target >= images.length) {
    return images;
  }
  const [item] = images.splice(index, 1);
  images.splice(target, 0, item);
  return images;
}

/** Promotes one entry to the cover slot (index 0) without reshuffling the rest. */
export function makeImagePrimary(current: readonly string[], index: number): string[] {
  if (index <= 0 || index >= current.length) return [...current];
  const images = [...current];
  const [item] = images.splice(index, 1);
  images.unshift(item);
  return images;
}

/** Element-wise comparison, used for editor dirty tracking. */
export function sameImageList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}
