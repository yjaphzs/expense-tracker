import { hexToOklch, oklchToHex } from "@/lib/appearance/color";
import { deriveDark } from "@/lib/appearance/derive-scheme";
import { CUSTOM_SCHEME, DEFAULT_SCHEME, SCHEME_PRESETS, type SchemeChoice } from "@/lib/appearance/schemes";

const FAVICON_ID = "expense-tracker-favicon";

/** The logo as an SVG data URL: the scheme's bright accent on the black tile. */
export function faviconHref(markHex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#000"/><g transform="translate(4 4)" fill="none" stroke="${markHex}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 16 6 6"/><circle cx="16" cy="9" r="2.9"/><circle cx="6" cy="5" r="3"/></g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** The glyph color for a choice: its dark-mode accent, which always reads on black. */
export function faviconMark(choice: SchemeChoice): string | null {
  if (choice.scheme === DEFAULT_SCHEME) return null;
  const seed =
    choice.scheme === CUSTOM_SCHEME
      ? choice.accent && hexToOklch(choice.accent)
      : SCHEME_PRESETS.find((preset) => preset.id === choice.scheme)?.dark;
  return seed ? oklchToHex(deriveDark(seed).primary) : null;
}

/**
 * Points the browser tab icon at a recolored SVG logo, or removes it for the
 * default amber so the static icons apply again. Home-screen and app icons are
 * fixed image files and keep the amber logo.
 */
export function applyFavicon(choice: SchemeChoice): void {
  const mark = faviconMark(choice);
  let link = document.getElementById(FAVICON_ID) as HTMLLinkElement | null;
  if (!mark) return void link?.remove();
  if (!link) {
    link = document.createElement("link");
    link.id = FAVICON_ID;
    link.rel = "icon";
    link.type = "image/svg+xml";
    document.head.appendChild(link);
  }
  link.href = faviconHref(mark);
}
