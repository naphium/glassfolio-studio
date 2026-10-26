import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { BadgeCheck, Clock, MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";
import { normalize, discordAvatar } from "@/lib/extras";
import { CursorGlow, ClickSparks, Overlay, Noise } from "@/components/site/Effects";
import { DiscordWidget, GithubWidget, Typewriter, lanyardQuery } from "@/components/site/Widgets";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, tableQuery, type SectionKey, type Status } from "@/lib/site";
import { Background } from "@/components/site/Background";
import { Player } from "@/components/site/Player";
import { themeStyle } from "@/components/site/ThemeVars";
import { About, Gallery, Guestbook, Links, Projects, Timeline } from "@/components/site/Sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nova Reyes — Portfolio" },
      { name: "description", content: "Projects, art, links and notes from Nova Reyes." },
      { property: "og:title", content: "Nova Reyes — Portfolio" },
      { property: "og:description", content: "Projects, art, links and notes from Nova Reyes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STATUS: Record<Status, { label: string; cls: string }> = {
  online: { label: "Online", cls: "bg-status-online" },
  coding: { label: "Coding", cls: "bg-status-coding" },
  gaming: { label: "Gaming", cls: "bg-status-gaming" },
  away: { label: "Away", cls: "bg-status-away" },
  custom: { label: "Custom", cls: "bg-primary" },
};

function LocalClock({ tz }: { tz: string }) {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const f = () => {
      try { setNow(new Date().toLocaleTimeString([], { timeZone: tz, hour: "2-digit", minute: "2-digit" })); }
      catch { setNow(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })); }
    };
    f(); const id = setInterval(f, 15000); return () => clearInterval(id);
  }, [tz]);
  return <span>{now}</span>;
}

function Index() {
  const settings = useQuery(settingsQuery);
  const cards = useQuery(tableQuery("cards"));
  const links = useQuery(tableQuery("links"));
  const projects = useQuery(tableQuery("projects"));
  const gallery = useQuery(tableQuery("gallery"));
  const tracks = useQuery(tableQuery("tracks"));
  const timeline = useQuery(tableQuery("timeline"));
  const guestbook = useQuery(tableQuery("guestbook"));
  const [tab, setTab] = useState<SectionKey | null>(null);

  useEffect(() => {
    supabase.from("page_views").insert({ path: "/", referrer: document.referrer.slice(0, 190) || null }).then(() => {});
  }, []);

  const s = settings.data ? normalize(settings.data) : null;
  const lanyard = useQuery({ ...lanyardQuery(s?.integrations.discordId ?? ""), enabled: !!s?.integrations.discordId });
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), { stiffness: 120, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), { stiffness: 120, damping: 20 });

  const enabledKeys = s?.sections.filter((x) => x.enabled).map((x) => x.key).join(",") ?? "";
  useEffect(() => {
    const keys = enabledKeys.split(",").filter(Boolean) as SectionKey[];
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea")) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      setTab((cur) => {
        const i = Math.max(0, keys.indexOf(cur ?? keys[0]!));
        return keys[(i + (e.key === "ArrowRight" ? 1 : -1) + keys.length) % keys.length] ?? null;
      });
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, [enabledKeys]);

  if (!s) return <div className="grid min-h-screen place-items-center bg-sky text-muted-foreground">Loading…</div>;
  const p = s.profile;
  const sections = s.sections.filter((x) => x.enabled);
  const active = tab && sections.some((x) => x.key === tab) ? tab : sections[0]?.key;
  let status: Status = p.status;
  let statusMsg = p.statusMessage;
  const ly = lanyard.data;
  if (s.integrations.syncStatusFromDiscord && ly) {
    const game = ly.activities.find((a) => a.type === 0);
    const code = game && /code|vim|jetbrains|zed|cursor/i.test(game.name);
    status = code ? "coding" : game ? "gaming" : ly.discord_status === "online" ? "online" : ly.discord_status === "offline" ? "away" : "away";
    statusMsg = game ? (code ? game.details ?? game.name : `Playing ${game.name}`) : ly.listening_to_spotify && ly.spotify ? `Listening to ${ly.spotify.song}` : ly.activities.find((a) => a.type === 4)?.state ?? ly.discord_status;
  }
  const st = STATUS[status] ?? STATUS.online;
  const fx = s.effects;
  const share = async () => {
    try { if (navigator.share) await navigator.share({ title: p.name, url: location.href }); else { await navigator.clipboard.writeText(location.href); toast.success("Link copied"); } } catch {}
  };

  const body: Record<SectionKey, React.ReactNode> = {
    live: (
      <div className="grid gap-3">
        {s.integrations.showDiscord && s.integrations.discordId && <DiscordWidget id={s.integrations.discordId} showSpotify={s.integrations.showSpotify} />}
        {s.integrations.showGithub && s.integrations.githubUser && <GithubWidget user={s.integrations.githubUser} />}
        {!s.integrations.discordId && !s.integrations.githubUser && <p className="text-sm text-muted-foreground">Connect Discord or GitHub in the dashboard to show live stats here.</p>}
      </div>
    ),
    about: <About profile={p} cards={cards.data ?? []} />,
    links: <Links links={links.data ?? []} />,
    projects: <Projects projects={projects.data ?? []} />,
    gallery: <Gallery items={gallery.data ?? []} />,
    timeline: <Timeline items={timeline.data ?? []} />,
    guestbook: <Guestbook entries={guestbook.data ?? []} />,
  };

  return (
    <div style={themeStyle(s.theme)} className="min-h-screen px-4 pb-32 pt-10 font-sans">
      <Background theme={s.theme} />
      {fx.cursorGlow && <CursorGlow />}
      {fx.clickSparks && <ClickSparks />}
      <Overlay kind={fx.overlay} />
      {fx.noise && <Noise />}
      <motion.main initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        style={fx.tilt ? { rotateX: rx, rotateY: ry, transformPerspective: 1200 } : undefined}
        onPointerMove={(e) => { if (!fx.tilt) return; const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5); }}
        onPointerLeave={() => { mx.set(0); my.set(0); }}
        className={`glass mx-auto max-w-3xl overflow-hidden rounded-3xl ${s.theme.glow ? "glass-glow" : ""}`}>
        <div className="h-36 bg-sky sm:h-44">
          {p.banner && <img src={p.banner} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
            <div className="relative">
              <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-background bg-muted">
                {(p.avatar || ly) ? <img src={p.avatar || discordAvatar(ly!.discord_user)} alt={p.name} className="h-full w-full object-cover" /> :
                  <div className="grid h-full w-full place-items-center font-display text-4xl text-primary">{p.name[0]}</div>}
              </div>
              <span className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-background ${st.cls}`} />
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {p.location && <span className="glass flex items-center gap-1 rounded-full px-3 py-1"><MapPin className="h-3 w-3" />{p.location}</span>}
              <span className="glass flex items-center gap-1 rounded-full px-3 py-1"><Clock className="h-3 w-3" /><LocalClock tz={p.timezone} /></span>
            </div>
          </div>
          <h1 className="mt-4 flex items-center gap-2 font-display text-3xl font-bold sm:text-4xl">
            <span className="text-gradient">{p.name}</span>
            {p.verified && <BadgeCheck className="h-6 w-6 text-primary" />}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{p.handle}</span>
            {fx.typewriter && p.tags.length > 0 && <><span>·</span><Typewriter words={p.tags} /></>}
            <button aria-label="Share" onClick={share} className="ml-auto rounded-full p-2 hover:bg-secondary"><Share2 className="h-4 w-4" /></button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs">
              <span className={`h-2 w-2 animate-pulse rounded-full ${st.cls}`} />{status === "custom" ? statusMsg : `${st.label} · ${statusMsg}`}
            </span>
            {p.tags.map((t) => <span key={t} className="rounded-full border border-primary/40 px-3 py-1 text-xs text-primary">{t}</span>)}
          </div>

          <nav className="mt-6 flex gap-1 overflow-x-auto rounded-full bg-secondary p-1">
            {sections.map((x) => (
              <button key={x.key} onClick={() => setTab(x.key)}
                className={`relative rounded-full px-4 py-1.5 text-sm transition-colors ${active === x.key ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {active === x.key && <motion.span layoutId="tab" className="absolute inset-0 rounded-full bg-primary" />}
                <span className="relative">{x.label}</span>
              </button>
            ))}
          </nav>
          <AnimatePresence mode="wait">
            <motion.section key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }} className="mt-6">
              {active && body[active]}
            </motion.section>
          </AnimatePresence>
        </div>
      </motion.main>
      {s.player.enabled && <Player tracks={(tracks.data ?? []) as any} autoplay={s.player.autoplay} initialVolume={s.player.volume} shuffle={s.player.shuffle} />}
    </div>
  );
}
