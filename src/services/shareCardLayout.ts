/**
 * Fixed-layout share card (ISSUE-004), 4:3 landscape.
 *
 * Deliberately free of Tauri / DOM imports so the exact same drawing code can be
 * exercised in a plain browser for design review. The card is always dark: it sits on
 * top of the user's cover image (whose brightness is unknown) and a scrim + light text
 * is the only combination that stays readable. With no image we keep the same dark
 * language instead of inventing a second look.
 *
 * The layout is band-based: every block owns a fixed vertical band, so all exported
 * cards share one silhouette regardless of content length. Title and description are
 * bottom-anchored inside their bands (a one-line title does not leave a hole), and the
 * body is capped at BODY_LINES with an explicit truncation note.
 */

export const SHARE_CARD_WIDTH = 1600;
export const SHARE_CARD_HEIGHT = 1200;
export const SHARE_CARD_SCALE = 2;

const SERIF = `"Newsreader", "Songti SC", "Source Serif 4", Georgia, serif`;
const SANS = `"Public Sans", "PingFang SC", "Microsoft YaHei", "IBM Plex Sans", system-ui, sans-serif`;

const INK = "#f6f3ec";
const INK_SOFT = "rgba(246, 243, 236, 0.82)";
const INK_BODY = "rgba(246, 243, 236, 0.93)";
const INK_FAINT = "rgba(246, 243, 236, 0.55)";
const INK_GHOST = "rgba(246, 243, 236, 0.34)";
const ACCENT = "#c9a24e";
const HAIRLINE = "rgba(246, 243, 236, 0.18)";
const SCRIM = "rgba(10, 10, 12, 0.34)";
const PANEL_FILL = "rgba(12, 12, 14, 0.74)";
const PANEL_EDGE = "rgba(246, 243, 236, 0.16)";
const BACKDROP = "#17181c";

// ---- fixed geometry (logical px, canvas is 1600 x 1200) ----
const MARGIN = 64;
const PANEL_W = 940; // with a cover, the panel leaves the subject of the image visible
const PANEL_H = 1000;
const PANEL_BOTTOM = MARGIN + PANEL_H; // 1064

const EYEBROW_BASELINE = 128;
const TITLE_BAND_BOTTOM = 276;
const TITLE_LINE_HEIGHT = 70;
const TITLE_LINES = 2;
const DIVIDER_Y = 312;
const META_BASELINE = 348;
const DESC_BAND_BOTTOM = 436;
const DESC_LINE_HEIGHT = 34;
const DESC_LINES = 2;
const LABEL_BASELINE = 482;
const BODY_TOP = 510;
const BODY_LINE_HEIGHT = 34;
const BODY_FONT_SIZE = 23;
const NOTE_BASELINE = PANEL_BOTTOM - 34;
const BODY_BOTTOM_LIMIT = NOTE_BASELINE - 40;
const BODY_LINES = Math.floor((BODY_BOTTOM_LIMIT - BODY_TOP) / BODY_LINE_HEIGHT);
const FOOTER_BASELINE = SHARE_CARD_HEIGHT - 50;

export interface ShareCardSpec {
  title: string;
  description?: string;
  model?: string;
  tags: string[];
  body: string;
  image: HTMLImageElement | null;
  width?: number;
  height?: number;
}

/** Break units: whole latin words (with trailing spaces), single CJK chars, space runs. */
function tokenize(text: string): string[] {
  return text.match(/[A-Za-z0-9_@#%&*+=/\\.,;:!?'”“'(){}\[\]<>$^-]+[ \t]*|[ \t]+|[^\s]/g) ?? [];
}

/** Closing punctuation must never start a line (CJK typography). */
const NO_LINE_START = /^[。，、；：？！）》」』】’”…%·]/;

/** Wraps `text` into at most `maxLines` lines and reports whether anything was cut. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const lines: string[] = [];
  let overflow = false;
  outer: for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    if (paragraph.trim() === "") {
      if (lines.length < maxLines) lines.push("");
      else overflow = true;
      continue;
    }
    let current = "";
    for (const unit of tokenize(paragraph)) {
      const candidate = current + unit;
      if (ctx.measureText(candidate).width > maxWidth && current.trim() !== "") {
        if (lines.length >= maxLines) {
          overflow = true;
          break outer;
        }
        if (NO_LINE_START.test(unit)) {
          // Keep the punctuation with the last glyph instead of orphaning it.
          lines.push((current + unit).replace(/\s+$/, ""));
          current = "";
          continue;
        }
        lines.push(current.replace(/\s+$/, ""));
        current = unit.replace(/^\s+/, "");
      } else {
        current = candidate;
      }
    }
    if (lines.length >= maxLines) {
      if (current.trim() !== "") overflow = true;
      break;
    }
    if (current.trim() !== "") lines.push(current.replace(/\s+$/, ""));
  }
  const kept = lines.slice(0, maxLines);
  while (kept.length > 1 && kept[kept.length - 1] === "") kept.pop();
  return { lines: kept, overflow };
}

/** Shortens `line` until an appended ellipsis still fits the measure. */
function withEllipsis(ctx: CanvasRenderingContext2D, line: string, maxWidth: number): string {
  let value = line.replace(/\s+$/, "");
  while (value.length > 1 && ctx.measureText(`${value}……`).width > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value}……`;
}

/** Draws up to `slots` lines, bottom-anchored so a short text does not leave a hole. */
function drawBand(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  color: string,
  innerX: number,
  maxWidth: number,
  slots: number,
  lineHeight: number,
  bandBottom: number
): boolean {
  ctx.font = font;
  ctx.fillStyle = color;
  const { lines, overflow } = wrap(ctx, text, maxWidth, slots);
  const shown = overflow && lines.length >= slots
    ? lines.slice(0, slots - 1).concat(withEllipsis(ctx, lines[slots - 1] ?? "", maxWidth))
    : lines;
  const firstBaseline = bandBottom - (shown.length - 1) * lineHeight;
  shown.forEach((line, i) => {
    if (line) ctx.fillText(line, innerX, firstBaseline + i * lineHeight);
  });
  return overflow;
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, color: string, spacing: number) {
  ctx.save();
  ctx.letterSpacing = `${spacing}px`;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  const width = ctx.measureText(text).width + Math.max(0, text.length - 1) * spacing;
  ctx.restore();
  return width;
}

function coverImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sw = width / ratio;
  const sh = height / ratio;
  ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, 0, 0, width, height);
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Paints the card. `ctx` must already be scaled by SHARE_CARD_SCALE. */
export function drawShareCard(ctx: CanvasRenderingContext2D, spec: ShareCardSpec): void {
  const width = spec.width ?? SHARE_CARD_WIDTH;
  const height = spec.height ?? SHARE_CARD_HEIGHT;

  // ---- backdrop: cover image, dimmed ----
  ctx.fillStyle = BACKDROP;
  ctx.fillRect(0, 0, width, height);
  if (spec.image) coverImage(ctx, spec.image, width, height);
  ctx.fillStyle = SCRIM;
  ctx.fillRect(0, 0, width, height);

  // ---- panel: full content width when there is no cover to reveal ----
  const panelW = spec.image ? PANEL_W : width - MARGIN * 2;
  const innerX = MARGIN + 44;
  const innerW = panelW - 88;
  roundRectPath(ctx, MARGIN, MARGIN, panelW, PANEL_H, 16);
  ctx.fillStyle = PANEL_FILL;
  ctx.fill();
  ctx.strokeStyle = PANEL_EDGE;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  spaced(ctx, "MT-DECK · PROMPT CARD", innerX, EYEBROW_BASELINE, `600 20px ${SANS}`, ACCENT, 4);

  const titleCut = drawBand(ctx, spec.title, `500 58px ${SERIF}`, INK, innerX, innerW, TITLE_LINES, TITLE_LINE_HEIGHT, TITLE_BAND_BOTTOM);

  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(innerX, DIVIDER_Y);
  ctx.lineTo(innerX + innerW, DIVIDER_Y);
  ctx.stroke();

  ctx.font = `400 22px ${SANS}`;
  ctx.fillStyle = INK_FAINT;
  const meta = [spec.model, spec.tags.join(" · ")].filter((v): v is string => Boolean(v && v.trim())).join("    |    ");
  ctx.fillText(meta, innerX, META_BASELINE);

  const descCut = drawBand(ctx, spec.description ?? "", `400 25px ${SANS}`, INK_SOFT, innerX, innerW, DESC_LINES, DESC_LINE_HEIGHT, DESC_BAND_BOTTOM);

  spaced(ctx, "PROMPT USED", innerX, LABEL_BASELINE, `600 19px ${SANS}`, INK_GHOST, 5);

  // ---- body ----
  ctx.font = `400 ${BODY_FONT_SIZE}px ${SANS}`;
  ctx.fillStyle = INK_BODY;
  const body = wrap(ctx, spec.body.trim(), innerW, BODY_LINES);
  const bodyLines = body.overflow && body.lines.length >= BODY_LINES
    ? body.lines.slice(0, BODY_LINES - 1).concat(withEllipsis(ctx, body.lines[BODY_LINES - 1] ?? "", innerW))
    : body.lines;
  bodyLines.forEach((line, i) => {
    if (line) ctx.fillText(line, innerX, BODY_TOP + i * BODY_LINE_HEIGHT);
  });

  if (body.overflow || titleCut || descCut) {
    ctx.font = `400 19px ${SANS}`;
    ctx.fillStyle = INK_GHOST;
    ctx.fillText("内容较长，已截断 · 完整提示词见 MT-Deck", innerX, NOTE_BASELINE);
  }

  // ---- footer, outside the panel ----
  const brandWidth = spaced(
    ctx,
    "TURN PROMPTS INTO REUSABLE ASSETS",
    MARGIN + 2,
    FOOTER_BASELINE,
    `500 21px ${SANS}`,
    INK_FAINT,
    4
  );
  ctx.strokeStyle = HAIRLINE;
  ctx.beginPath();
  ctx.moveTo(MARGIN + 2 + brandWidth + 28, FOOTER_BASELINE - 8);
  ctx.lineTo(width - MARGIN - 250, FOOTER_BASELINE - 8);
  ctx.stroke();
  ctx.textAlign = "right";
  ctx.font = `400 21px ${SANS}`;
  ctx.fillStyle = INK_FAINT;
  ctx.fillText("MT-Deck 本地提示词库", width - MARGIN, FOOTER_BASELINE);
  ctx.textAlign = "left";
}
