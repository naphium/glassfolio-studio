import type { SiteData } from "./site";

export interface Effects {
  cursorGlow: boolean;
  tilt: boolean;
  overlay: "none" | "snow" | "rain" | "fireflies" | "sakura";
  noise: boolean;
  typewriter: boolean;
  clickSparks: boolean;
}
export interface Integrations {
  discordId: string;
  githubUser: string;
  syncStatusFromDiscord: boolean;
  showDiscord: boolean;
  showGithub: boolean;
  showSpotify: boolean;
}
export type FullSite = SiteData & {
  effects: Effects;
  integrations: Integrations;
  player: { enabled: boolean; autoplay: boolean; volume: number; shuffle: boolean };
  theme: SiteData["theme"] & { preset: string };
};

export const DEFAULT_EFFECTS: Effects = { cursorGlow: true, tilt: true, overlay: "none", noise: true, typewriter: true, clickSparks: true };
export const DEFAULT_INTEGRATIONS: Integrations = { discordId: "", githubUser: "", syncStatusFromDiscord: true, showDiscord: true, showGithub: true, showSpotify: true };

export function normalize(s: SiteData): FullSite {
  const any = s as any;
  const sections = s.sections.some((x) => x.key === "live") ? s.sections : [{ key: "live" as const, label: "Live", enabled: true }, ...s.sections];
  return {
    ...s,
    sections,
    theme: { preset: "midnight", ...s.theme },
    effects: { ...DEFAULT_EFFECTS, ...(any.effects ?? {}) },
    integrations: { ...DEFAULT_INTEGRATIONS, ...(any.integrations ?? {}) },
    player: { enabled: true, autoplay: false, volume: 0.5, shuffle: false, ...(any.player ?? {}) },
  };
}

export const PRESETS: Record<string, { label: string; theme: Partial<FullSite["theme"]>; overlay?: Effects["overlay"] }> = {
  midnight: { label: "Midnight Sky", theme: { accent: "#7dd3fc", background: "particles", glass: 0.08, blur: 24, font: "space" } },
  aurora: { label: "Aurora", theme: { accent: "#6ee7b7", background: "aurora", glass: 0.06, blur: 30, font: "syne" } },
  sakura: { label: "Sakura", theme: { accent: "#f9a8d4", background: "gradient", glass: 0.1, blur: 20, font: "serif" }, overlay: "sakura" },
  ember: { label: "Ember", theme: { accent: "#fb923c", background: "aurora", glass: 0.07, blur: 26, font: "space" }, overlay: "fireflies" },
  terminal: { label: "Terminal", theme: { accent: "#4ade80", background: "matrix", glass: 0.04, blur: 10, font: "mono" } },
  frost: { label: "Frost", theme: { accent: "#e0f2fe", background: "particles", glass: 0.14, blur: 40, font: "space" }, overlay: "snow" },
  storm: { label: "Storm", theme: { accent: "#a5b4fc", background: "gradient", glass: 0.06, blur: 22, font: "syne" }, overlay: "rain" },
  gold: { label: "Royal Gold", theme: { accent: "#fcd34d", background: "aurora", glass: 0.09, blur: 28, font: "serif" } },
};

/* ---------- Live data from public APIs ---------- */
export type Lanyard = {
  discord_user: { id: string; username: string; global_name?: string; avatar: string | null };
  discord_status: "online" | "idle" | "dnd" | "offline";
  activities: { name: string; type: number; state?: string; details?: string; assets?: { large_image?: string; large_text?: string }; application_id?: string; timestamps?: { start?: number } }[];
  listening_to_spotify: boolean;
  spotify: null | { song: string; artist: string; album: string; album_art_url: string; track_id: string; timestamps: { start: number; end: number } };
};

export async function fetchLanyard(id: string): Promise<Lanyard> {
  const r = await fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(id)}`);
  const j = await r.json();
  if (!j.success) throw new Error(j.error?.message ?? "Discord user not found on Lanyard");
  return j.data;
}

export async function fetchGithub(user: string) {
  const u = encodeURIComponent(user);
  const [p, r] = await Promise.all([
    fetch(`https://api.github.com/users/${u}`).then((x) => x.json()),
    fetch(`https://api.github.com/users/${u}/repos?sort=updated&per_page=100`).then((x) => x.json()),
  ]);
  if (p.message) throw new Error(p.message);
  const repos = Array.isArray(r) ? r : [];
  const stars = repos.reduce((a: number, x: any) => a + x.stargazers_count, 0);
  const langs: Record<string, number> = {};
  repos.forEach((x: any) => x.language && (langs[x.language] = (langs[x.language] ?? 0) + 1));
  const top = [...repos].sort((a: any, b: any) => b.stargazers_count - a.stargazers_count).slice(0, 4);
  return { profile: p, stars, langs: Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 6), top };
}

export function discordAvatar(u: Lanyard["discord_user"]) {
  return u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128` : `https://cdn.discordapp.com/embed/avatars/0.png`;
}
export function activityImage(a: Lanyard["activities"][number]) {
  const img = a.assets?.large_image;
  if (!img) return null;
  if (img.startsWith("mp:external/")) return `https://media.discordapp.net/external/${img.replace("mp:external/", "")}`;
  return a.application_id ? `https://cdn.discordapp.com/app-assets/${a.application_id}/${img}.png` : null;
}
