import { FONTS, type SiteData } from "@/lib/site";
import type { CSSProperties } from "react";

/** Converts admin-chosen theme values into design-token overrides. */
export function themeStyle(theme: SiteData["theme"]): CSSProperties {
  return {
    "--user-accent": theme.accent,
    "--glass-alpha": String(theme.glass),
    "--glass-blur": `${theme.blur}px`,
    "--site-font": FONTS[theme.font] ?? FONTS.space,
  } as CSSProperties;
}
