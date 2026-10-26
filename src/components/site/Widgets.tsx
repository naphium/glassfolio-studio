import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Github, Star, Users, BookOpen, Music2, Gamepad2 } from "lucide-react";
import { activityImage, discordAvatar, fetchGithub, fetchLanyard, type Lanyard } from "@/lib/extras";

export const lanyardQuery = (id: string) => ({
  queryKey: ["lanyard", id],
  queryFn: () => fetchLanyard(id),
  enabled: !!id,
  refetchInterval: 20000,
  retry: false,
});

const DOT: Record<Lanyard["discord_status"], string> = {
  online: "bg-status-online", idle: "bg-status-away", dnd: "bg-destructive", offline: "bg-muted-foreground",
};

function Elapsed({ start }: { start: number }) {
  const [, f] = useState(0);
  useEffect(() => { const i = setInterval(() => f((x) => x + 1), 1000); return () => clearInterval(i); }, []);
  const s = Math.floor((Date.now() - start) / 1000);
  return <span>{Math.floor(s / 3600) ? `${Math.floor(s / 3600)}h ` : ""}{Math.floor((s % 3600) / 60)}m {s % 60}s elapsed</span>;
}

export function DiscordWidget({ id, showSpotify }: { id: string; showSpotify: boolean }) {
  const { data, error } = useQuery(lanyardQuery(id));
  if (error) return <div className="tile p-4 text-sm text-muted-foreground">Discord: {(error as Error).message}</div>;
  if (!data) return <div className="tile h-24 animate-pulse" />;
  const acts = data.activities.filter((a) => a.type !== 4 && a.type !== 2);
  const custom = data.activities.find((a) => a.type === 4);
  const sp = data.spotify;
  const pct = sp ? Math.min(100, ((Date.now() - sp.timestamps.start) / (sp.timestamps.end - sp.timestamps.start)) * 100) : 0;
  return (
    <div className="tile space-y-3 p-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img src={discordAvatar(data.discord_user)} alt="" className="h-12 w-12 rounded-full" />
          <span className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background ${DOT[data.discord_status]}`} />
        </div>
        <div className="min-w-0">
          <div className="font-semibold">{data.discord_user.global_name ?? data.discord_user.username}</div>
          <div className="truncate text-xs text-muted-foreground">{custom?.state ?? `@${data.discord_user.username} · ${data.discord_status}`}</div>
        </div>
        <span className="ml-auto text-[10px] uppercase tracking-widest text-primary">Discord · live</span>
      </div>
      {acts.map((a, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg bg-secondary p-2">
          {activityImage(a) ? <img src={activityImage(a)!} alt="" className="h-10 w-10 rounded-md" /> : <Gamepad2 className="m-2 h-6 w-6 text-primary" />}
          <div className="min-w-0 text-xs">
            <div className="truncate font-semibold text-foreground">{a.name}</div>
            {a.details && <div className="truncate text-muted-foreground">{a.details}</div>}
            {a.state && <div className="truncate text-muted-foreground">{a.state}</div>}
            {a.timestamps?.start && <div className="text-muted-foreground"><Elapsed start={a.timestamps.start} /></div>}
          </div>
        </div>
      ))}
      {showSpotify && sp && (
        <a href={`https://open.spotify.com/track/${sp.track_id}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg bg-secondary p-2">
          <img src={sp.album_art_url} alt="" className="h-10 w-10 rounded-md" />
          <div className="min-w-0 flex-1 text-xs">
            <div className="flex items-center gap-1 truncate font-semibold"><Music2 className="h-3 w-3 text-status-online" />{sp.song}</div>
            <div className="truncate text-muted-foreground">{sp.artist}</div>
            <div className="mt-1 h-1 overflow-hidden rounded bg-muted"><div className="h-full bg-status-online" style={{ width: `${pct}%` }} /></div>
          </div>
        </a>
      )}
    </div>
  );
}

export function GithubWidget({ user }: { user: string }) {
  const { data, error } = useQuery({ queryKey: ["github", user], queryFn: () => fetchGithub(user), enabled: !!user, staleTime: 6e5, retry: false });
  if (error) return <div className="tile p-4 text-sm text-muted-foreground">GitHub: {(error as Error).message}</div>;
  if (!data) return <div className="tile h-24 animate-pulse" />;
  const p = data.profile;
  return (
    <div className="tile space-y-3 p-4">
      <a href={p.html_url} target="_blank" rel="noreferrer" className="flex items-center gap-3">
        <img src={p.avatar_url} alt="" className="h-12 w-12 rounded-full" />
        <div className="min-w-0">
          <div className="flex items-center gap-1 font-semibold"><Github className="h-4 w-4" />{p.name ?? p.login}</div>
          <div className="truncate text-xs text-muted-foreground">{p.bio ?? `@${p.login}`}</div>
        </div>
      </a>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-secondary p-2"><BookOpen className="mx-auto mb-1 h-4 w-4 text-primary" />{p.public_repos} repos</div>
        <div className="rounded-lg bg-secondary p-2"><Star className="mx-auto mb-1 h-4 w-4 text-primary" />{data.stars} stars</div>
        <div className="rounded-lg bg-secondary p-2"><Users className="mx-auto mb-1 h-4 w-4 text-primary" />{p.followers} followers</div>
      </div>
      <div className="flex flex-wrap gap-1">{data.langs.map(([l, n]) => <span key={l} className="rounded-full border border-primary/40 px-2 py-0.5 text-xs text-primary">{l} · {n}</span>)}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {data.top.map((r: any) => (
          <a key={r.id} href={r.html_url} target="_blank" rel="noreferrer" className="rounded-lg bg-secondary p-2 text-xs hover:bg-accent">
            <div className="truncate font-semibold">{r.name}</div>
            <div className="line-clamp-1 text-muted-foreground">{r.description ?? "—"}</div>
            <div className="mt-1 flex gap-2 text-muted-foreground"><span>★ {r.stargazers_count}</span>{r.language && <span>{r.language}</span>}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

export function Typewriter({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const [del, setDel] = useState(false);
  const w = words[i % Math.max(words.length, 1)] ?? "";
  useEffect(() => {
    const t = setTimeout(() => {
      if (!del && n < w.length) setN(n + 1);
      else if (!del) setDel(true);
      else if (n > 0) setN(n - 1);
      else { setDel(false); setI(i + 1); }
    }, !del && n === w.length ? 1400 : del ? 35 : 70);
    return () => clearTimeout(t);
  }, [n, del, w, i]);
  return <span className="text-primary">{w.slice(0, n)}<span className="animate-pulse">▍</span></span>;
}
