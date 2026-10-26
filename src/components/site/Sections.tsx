import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Github, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { faviconFor, type SiteData } from "@/lib/site";
import { DynIcon } from "./DynIcon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Row = Record<string, any>;

export function About({ profile, cards }: { profile: SiteData["profile"]; cards: Row[] }) {
  const [q, setQ] = useState(0);
  useEffect(() => {
    if (profile.quotes.length < 2) return;
    const id = setInterval(() => setQ((x) => (x + 1) % profile.quotes.length), 5000);
    return () => clearInterval(id);
  }, [profile.quotes.length]);
  return (
    <div className="space-y-5">
      <p className="leading-relaxed text-foreground/85">{profile.bio}</p>
      {profile.quotes.length > 0 && (
        <div className="relative h-14 overflow-hidden border-l-2 border-primary pl-4">
          <AnimatePresence mode="wait">
            <motion.p key={q} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="font-display text-lg italic text-muted-foreground">“{profile.quotes[q]}”</motion.p>
          </AnimatePresence>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <div key={c.id} className="tile p-4">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
              <DynIcon name={c.icon} className="h-4 w-4" /> {c.category}
            </div>
            <div className="font-semibold">{c.title}</div>
            <div className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Links({ links }: { links: Row[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {links.map((l) => (
        <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="tile flex items-center gap-3 p-3">
          {l.icon === "auto" ? <img src={faviconFor(l.url)} alt="" className="h-6 w-6 rounded" /> :
            <DynIcon name={l.icon} className="h-5 w-5 text-primary" />}
          <span className="flex-1 font-medium">{l.title}</span>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </a>
      ))}
    </div>
  );
}

export function Projects({ projects }: { projects: Row[] }) {
  const [open, setOpen] = useState<Row | null>(null);
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((p) => (
          <button key={p.id} onClick={() => setOpen(p)} className="tile overflow-hidden text-left">
            {p.image_url && <img src={p.image_url} alt={p.title} className="aspect-video w-full object-cover" />}
            <div className="p-4">
              <div className="font-semibold">{p.title}</div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">{p.tags?.map((t: string) => (
                <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{t}</span>))}</div>
            </div>
          </button>
        ))}
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)}>
        {open && (
          <div>
            {open.image_url && <img src={open.image_url} alt="" className="mb-4 w-full rounded-xl" />}
            <h3 className="font-display text-2xl font-bold">{open.title}</h3>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">{open.description}</p>
            <div className="mt-4 flex gap-2">
              {open.live_url && <Button asChild><a href={open.live_url} target="_blank" rel="noreferrer"><ExternalLink /> Live</a></Button>}
              {open.repo_url && <Button asChild variant="secondary"><a href={open.repo_url} target="_blank" rel="noreferrer"><Github /> Code</a></Button>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export function Gallery({ items }: { items: Row[] }) {
  const cats = ["All", ...Array.from(new Set(items.map((g) => g.category)))];
  const [cat, setCat] = useState("All");
  const [zoom, setZoom] = useState<Row | null>(null);
  const shown = items.filter((g) => cat === "All" || g.category === cat);
  if (!items.length) return <p className="text-muted-foreground">No artwork yet.</p>;
  return (
    <>
      <div className="mb-3 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`rounded-full px-3 py-1 text-xs ${cat === c ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{c}</button>
        ))}
      </div>
      <div className="columns-2 gap-3 sm:columns-3">
        {shown.map((g) => (
          <button key={g.id} onClick={() => setZoom(g)} className="mb-3 block w-full overflow-hidden rounded-xl">
            <img src={g.image_url} alt={g.caption} className="w-full transition-transform hover:scale-105" />
          </button>
        ))}
      </div>
      <Modal open={!!zoom} onClose={() => setZoom(null)} wide>
        {zoom && (<><img src={zoom.image_url} alt="" className="max-h-[75vh] w-full rounded-xl object-contain" />
          <p className="mt-3 text-center text-muted-foreground">{zoom.caption}</p></>)}
      </Modal>
    </>
  );
}

export function Timeline({ items }: { items: Row[] }) {
  return (
    <ol className="relative ml-2 space-y-6 border-l border-border pl-6">
      {items.map((t) => (
        <li key={t.id} className="relative">
          <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-primary glass-glow" />
          <div className="text-xs uppercase tracking-widest text-primary">{t.date_label}</div>
          <div className="font-semibold">{t.title}</div>
          <p className="text-sm text-muted-foreground">{t.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function Guestbook({ entries }: { entries: Row[] }) {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("guestbook").insert({ name: name.trim().slice(0, 60), message: msg.trim().slice(0, 500) });
    setBusy(false);
    if (error) return toast.error("Couldn't sign the guestbook");
    setName(""); setMsg("");
    toast.success("Thanks! Your message will appear after approval.");
  };
  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-2">
        <Input required maxLength={60} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea required maxLength={500} placeholder="Leave a note…" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <Button disabled={busy}>Sign guestbook</Button>
      </form>
      {entries.map((g) => (
        <div key={g.id} className="tile p-3">
          <div className="text-sm font-semibold">{g.name} <span className="text-xs font-normal text-muted-foreground">· {new Date(g.created_at).toLocaleDateString()}</span></div>
          <p className="text-sm text-muted-foreground">{g.message}</p>
        </div>
      ))}
    </div>
  );
}

function Modal({ open, onClose, children, wide }: { open: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()}
            className={`glass glass-glow relative max-h-[90vh] w-full overflow-auto rounded-3xl p-6 ${wide ? "max-w-4xl" : "max-w-xl"}`}>
            <button aria-label="Close" onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X /></button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
