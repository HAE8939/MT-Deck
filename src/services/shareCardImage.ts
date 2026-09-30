import type { Prompt } from "../types/prompt";
import { api } from "./promptService";
import { isRemoteImageReference, resolvePromptImagePath } from "./imageAssets";
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_SCALE,
  SHARE_CARD_WIDTH,
  drawShareCard,
} from "./shareCardLayout";

/**
 * Turns a prompt into the fixed 4:3 share-card PNG (ISSUE-004).
 *
 * The reference image is pulled through Rust as base64 and handed to the canvas from
 * a `blob:` URL — loading it via the cross-origin asset protocol would taint the
 * canvas and make `toDataURL` throw.
 */

function mimeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "bmp") return "image/bmp";
  if (ext === "svg") return "image/svg+xml";
  if (ext === "avif") return "image/avif";
  return "image/png";
}

async function loadCoverImage(libraryRoot: string, image?: string): Promise<HTMLImageElement | null> {
  if (!image || isRemoteImageReference(image)) return null;
  const path = resolvePromptImagePath(libraryRoot, image);
  if (!path) return null;
  const base64 = await api.readImageBase64(path);
  if (!base64) return null;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeFromPath(path) }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Renders the card and returns a base64 PNG (no data-URL prefix). */
export async function renderShareCardBase64(prompt: Prompt, libraryRoot: string): Promise<string | null> {
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH * SHARE_CARD_SCALE;
  canvas.height = SHARE_CARD_HEIGHT * SHARE_CARD_SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const image = await loadCoverImage(libraryRoot, prompt.image);
  ctx.scale(SHARE_CARD_SCALE, SHARE_CARD_SCALE);
  drawShareCard(ctx, {
    title: prompt.title,
    description: prompt.description,
    model: prompt.model,
    tags: prompt.tags,
    body: prompt.promptContent,
    image,
  });

  return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
}
