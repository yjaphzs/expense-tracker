import { cn } from "@/lib/utils";

/**
 * The app mark (a hand holding coins, as in the original artwork) drawn as SVG
 * so it follows the color scheme: `--logo-tile` behind, `--logo-mark` for the
 * glyph. Both default to the black tile and the accent (globals.css); a scheme
 * whose accent is too dark for black swaps them (lib/appearance). The paths
 * match the tab icon in lib/appearance/favicon.ts.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" fill="var(--logo-tile)" />
      <g
        transform="translate(4 4)"
        fill="none"
        stroke="var(--logo-mark)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
        <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
        <path d="m2 16 6 6" />
        <circle cx="16" cy="9" r="2.9" />
        <circle cx="6" cy="5" r="3" />
      </g>
    </svg>
  );
}
