import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2, Music } from "lucide-react";
import { Slider } from "@/components/ui/slider";

type Track = { id: string; title: string; artist: string; audio_url: string; cover_url: string | null };

const fmt = (s: number) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

export function Player({ tracks, autoplay = false, initialVolume = 0.6, shuffle = false }: { tracks: Track[]; autoplay?: boolean; initialVolume?: number; shuffle?: boolean }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [d, setD] = useState(0);
  const [vol, setVol] = useState(initialVolume);
  const [hint, setHint] = useState(false);
  const track = tracks[i];

  useEffect(() => { if (audio.current) audio.current.volume = vol; }, [vol]);
  useEffect(() => { if (playing) audio.current?.play().catch(() => setPlaying(false)); }, [i]);
  // Autoplay: try right away; browsers usually block sound until the visitor interacts, so retry on first click/key.
  useEffect(() => {
    if (!autoplay || !tracks.length) return;
    const start = () => audio.current?.play().then(() => { setPlaying(true); setHint(false); cleanup(); }).catch(() => setHint(true));
    const cleanup = () => { removeEventListener("pointerdown", start); removeEventListener("keydown", start); };
    const t = setTimeout(start, 300);
    addEventListener("pointerdown", start); addEventListener("keydown", start);
    return () => { clearTimeout(t); cleanup(); };
  }, [autoplay, tracks.length]);

  if (!track) return null;
  const toggle = () => {
    const a = audio.current!;
    if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
  };
  const go = (n: number) => setI(shuffle && tracks.length > 1 ? (i + 1 + Math.floor(Math.random() * (tracks.length - 1))) % tracks.length : (i + n + tracks.length) % tracks.length);

  return (
    <div className="fixed inset-x-0 bottom-3 z-40 mx-auto w-[min(640px,calc(100%-1.5rem))]">
      <div className="glass glass-glow flex items-center gap-3 rounded-2xl px-3 py-2">
        <audio ref={audio} src={track.audio_url} onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setD(e.currentTarget.duration)} onEnded={() => go(1)} />
        <div className={`h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted ${playing ? "animate-spin-slow" : ""}`}>
          {track.cover_url ? <img src={track.cover_url} alt="" className="h-full w-full object-cover" /> :
            <Music className="m-3 h-5 w-5 text-primary" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{track.title}{track.artist && <span className="text-muted-foreground"> · {track.artist}</span>}{hint && !playing && <span className="ml-2 text-xs text-primary">tap anywhere for sound</span>}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{fmt(t)}</span>
            <Slider value={[t]} max={d || 1} step={0.1} className="flex-1"
              onValueChange={([v]) => { if (audio.current && v !== undefined) audio.current.currentTime = v; }} />
            <span>{fmt(d)}</span>
          </div>
        </div>
        <button aria-label="Previous" onClick={() => go(-1)} className="text-muted-foreground hover:text-foreground"><SkipBack className="h-4 w-4" /></button>
        <button aria-label={playing ? "Pause" : "Play"} onClick={toggle} className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button aria-label="Next" onClick={() => go(1)} className="text-muted-foreground hover:text-foreground"><SkipForward className="h-4 w-4" /></button>
        <div className="hidden w-20 items-center gap-1 sm:flex">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider value={[vol]} max={1} step={0.01} onValueChange={([v]) => setVol(v ?? 0)} />
        </div>
      </div>
    </div>
  );
}
