import { useEffect, useRef } from "react";
import type { Effects } from "@/lib/extras";

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const m = (e: PointerEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
    };
    addEventListener("pointermove", m);
    return () => removeEventListener("pointermove", m);
  }, []);
  return <div ref={ref} className="cursor-glow pointer-events-none fixed left-0 top-0 -z-[5] h-[400px] w-[400px] rounded-full" />;
}

export function ClickSparks() {
  useEffect(() => {
    const h = (e: PointerEvent) => {
      for (let i = 0; i < 8; i++) {
        const s = document.createElement("span");
        s.className = "spark";
        const a = (i / 8) * Math.PI * 2;
        s.style.left = e.clientX + "px";
        s.style.top = e.clientY + "px";
        s.style.setProperty("--dx", Math.cos(a) * 30 + "px");
        s.style.setProperty("--dy", Math.sin(a) * 30 + "px");
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 500);
      }
    };
    addEventListener("pointerdown", h);
    return () => removeEventListener("pointerdown", h);
  }, []);
  return null;
}

export function Overlay({ kind }: { kind: Effects["overlay"] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (kind === "none") return;
    const c = ref.current!, ctx = c.getContext("2d")!;
    const color = getComputedStyle(c).color;
    let raf = 0;
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize(); addEventListener("resize", resize);
    const n = kind === "rain" ? 160 : kind === "fireflies" ? 45 : 90;
    const ps = Array.from({ length: n }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, s: Math.random() + 0.5, t: Math.random() * 9 }));
    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of ps) {
        p.t += 0.02;
        if (kind === "rain") {
          p.y += 12 * p.s; p.x -= 1;
          ctx.strokeStyle = "rgba(200,220,255,.35)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 2, p.y - 14 * p.s); ctx.stroke();
        } else if (kind === "snow") {
          p.y += p.s; p.x += Math.sin(p.t) * 0.5;
          ctx.globalAlpha = 0.8; ctx.fillStyle = "white";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 2, 0, 7); ctx.fill();
        } else if (kind === "sakura") {
          p.y += p.s * 0.9; p.x += Math.sin(p.t) * 1.2;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t); ctx.globalAlpha = 0.85; ctx.fillStyle = color;
          ctx.beginPath(); ctx.ellipse(0, 0, 5 * p.s, 3 * p.s, 0, 0, 7); ctx.fill(); ctx.restore();
        } else {
          p.x += Math.cos(p.t) * 0.6; p.y += Math.sin(p.t * 0.7) * 0.6;
          ctx.globalAlpha = 0.4 + Math.sin(p.t * 2) * 0.4; ctx.fillStyle = color;
          ctx.shadowBlur = 12; ctx.shadowColor = color;
          ctx.beginPath(); ctx.arc(p.x, p.y, 2 * p.s, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        }
        if (p.y > c.height + 20) { p.y = -20; p.x = Math.random() * c.width; }
        if (p.x < -20) p.x = c.width + 10;
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, [kind]);
  if (kind === "none") return null;
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-30 text-primary" />;
}

export function Noise() {
  return <div className="noise pointer-events-none fixed inset-0 z-[31]" />;
}
