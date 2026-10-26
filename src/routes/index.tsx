import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck, Clock, MapPin } from "lucide-react";
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

  const s = settings.data;
  if (!s) return <div className="grid min-h-screen place-items-center bg-sky text-muted-foreground">Loading…</div>;
  const p = s.profile;
  const sections = s.sections.filter((x) => x.enabled);
  const active = tab && sections.some((x) => x.key === tab) ? tab : sections[0]?.key;
  const st = STATUS[p.status] ?? STATUS.online;

  const body: Record<SectionKey, React.ReactNode> = {
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
      <motion.main initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className={`glass mx-auto max-w-3xl overflow-hidden rounded-3xl ${s.theme.glow ? "glass-glow" : ""}`}>
        <div className="h-36 bg-sky sm:h-44">
          {p.banner && <img src={p.banner} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
            <div className="relative">
              <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-background bg-muted">
                {p.avatar ? <img src={p.avatar} alt={p.name} className="h-full w-full object-cover" /> :
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
          <div className="mt-1 text-sm text-muted-foreground">{p.handle}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs">
              <span className={`h-2 w-2 rounded-full ${st.cls}`} />{p.status === "custom" ? p.statusMessage : `${st.label} · ${p.statusMessage}`}
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
      {s.player.enabled && <Player tracks={(tracks.data ?? []) as any} />}
    </div>
  );
}
