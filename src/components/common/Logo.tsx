/**
 * MT-Deck brand mark — a serif-styled "M" monogram.
 *
 * Geometry is taken verbatim from the user-supplied logo.svg. The polygons use
 * `fill: currentColor`, so the mark inherits whatever CSS `color` is set on it
 * and therefore adapts to the light/dark theme automatically.
 */
export function Logo({
  size = 20,
  className,
  title,
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size * (93.24 / 99.59)}
      viewBox="0 0 99.59 93.24"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <polygon
        fill="currentColor"
        points="49.43 33.08 53.19 17.27 18.05 17.27 0 93.24 5.79 93.24 22.58 22.54 46.15 22.54 43.64 33.08 31.47 33.08 30.76 38.36 42.39 38.36 34.67 70.85 40.46 70.85 48.18 38.36 71.07 38.36 58.04 93.24 63.83 93.24 78.12 33.08 49.43 33.08"
      />
      <polygon
        fill="currentColor"
        points="22.87 0 21.65 5.28 92.54 5.28 76.97 70.85 82.76 70.85 99.59 0 22.87 0"
      />
    </svg>
  );
}
