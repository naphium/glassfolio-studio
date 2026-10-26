import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SectionKey = "about" | "links" | "projects" | "gallery" | "timeline" | "guestbook";
export type Status = "online" | "coding" | "gaming" | "away" | "custom";

export interface SiteData {
  profile: {
    name: string;
    handle: string;
    avatar: string;
    banner: string;
    status: Status;
    statusMessage: string;
    location: string;
    timezone: string;
    verified: boolean;
    tags: string[];
    bio: string;
    quotes: string[];
  };
  theme: {
    background: "particles" | "image" | "video" | "gradient";
    bgImage: string;
    bgVideo: string;
    accent: string;
    glow: boolean;
    glass: number;
    blur: number;
    font: "space" | "syne" | "mono" | "serif";
  };
  sections: { key: SectionKey; label: string; enabled: boolean }[];
  player: { enabled: boolean };
}

export const FONTS: Record<SiteData["theme"]["font"], string> = {
  space: '"Space Grotesk"',
  syne: '"Syne"',
  mono: '"JetBrains Mono"',
  serif: '"Instrument Serif"',
};

export const CONTENT_TABLES = ["cards", "links", "projects", "gallery", "tracks", "timeline"] as const;
export type ContentTable = (typeof CONTENT_TABLES)[number];

export const settingsQuery = queryOptions({
  queryKey: ["site_settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_settings").select("data").eq("id", 1).single();
    if (error) throw error;
    return data.data as unknown as SiteData;
  },
});

export const tableQuery = (table: ContentTable | "guestbook") =>
  queryOptions({
    queryKey: ["table", table],
    queryFn: async () => {
      const q = supabase.from(table).select("*");
      const { data, error } =
        table === "guestbook" ? await q.order("created_at", { ascending: false }) : await q.order("sort");
      if (error) throw error;
      return data as Record<string, any>[];
    },
  });

export function faviconFor(url: string) {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
  } catch {
    return "";
  }
}

export async function uploadMedia(file: File): Promise<string> {
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const { error } = await supabase.storage.from("media").upload(path, file);
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2) throw e2;
  return data.signedUrl;
}
