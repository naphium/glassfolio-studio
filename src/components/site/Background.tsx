import { useEffect, useRef } from "react";
import type { SiteData } from "@/lib/site";

function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    const accent = getComputedStyle(c).color;
    const resize = () => {
      c.width = innerWidth * devicePixelRatio;
      c.height = innerHeight * devicePixelRatio;
    };
    resize();
    addEventListener("resize", resize);
    const pts = Array.from({ length: 110 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + 0.3,
      vx: (Math.random() - 0.5) * 0.0003, vy: (Math.random() - 0.5) * 0.0003, t: Math.random() * 6,
    }));
    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of pts) {
        p.x = (p.x + p.vx + 1) % 1; p.y = (p.y + p.vy + 1) % 1; p.t += 0.02;
        ctx.globalAlpha = 0.35 + Math.sin(p.t) * 0.35;
        ctx.fillStyle = p.r > 1.4 ? accent : "white";
        ctx.beginPath();
        ctx.arc(p.x * c.width, p.y * c.height, p.r * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full text-primary" />;
}

function Matrix() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext("2d")!;
    const color = getComputedStyle(c).color;
    c.width = innerWidth; c.height = innerHeight;
    const cols = Math.floor(c.width / 16), drops = Array(cols).fill(0).map(() => Math.random() * -50);
    const id = setInterval(() => {
      ctx.fillStyle = "rgba(5,8,12,0.12)"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = color; ctx.font = "14px monospace";
      drops.forEach((y, i) => {
        ctx.fillText(String.fromCharCode(0x30a0 + Math.random() * 96), i * 16, y * 16);
        drops[i] = y * 16 > c.height && Math.random() > 0.975 ? 0 : y + 1;
      });
    }, 50);
    return () => clearInterval(id);
  }, []);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full text-primary opacity-60" />;
}

export function Background({ theme }: { theme: SiteData["theme"] }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-sky">
      {theme.background === "image" && theme.bgImage && (
        <img src={theme.bgImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      )}
      {theme.background === "video" && theme.bgVideo && (
        <video src={theme.bgVideo} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-70" />
      )}
      {theme.background === "particles" && <Particles />}
      {theme.background === "matrix" && <Matrix />}
      {theme.background === "aurora" && (
        <>
          <div className="aurora-blob -left-1/4 -top-1/4 bg-primary" />
          <div className="aurora-blob bottom-[-30%] right-[-20%] bg-status-gaming [animation-delay:-8s]" />
          <div className="aurora-blob left-1/3 top-1/3 bg-status-coding [animation-delay:-14s]" />
          <Particles />
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/80" />
    </div>
  );
}
