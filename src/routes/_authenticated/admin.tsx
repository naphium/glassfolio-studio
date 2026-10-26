import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, tableQuery, type SiteData } from "@/lib/site";
import { CrudManager, UploadButton, type Field } from "@/components/admin/CrudManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Portfolio" },
      { name: "description", content: "Manage every part of the portfolio." },
      { property: "og:title", content: "Admin — Portfolio" },
      { property: "og:description", content: "Manage every part of the portfolio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const F = (key: string, label: string, type: Field["type"] = "text"): Field => ({ key, label, type });

function Admin() {
  const { user } = Route.useRouteContext();
  const nav = useNavigate();
  const qc = useQueryClient();
  const isAdmin = useQuery({
    queryKey: ["is_admin", user.id],
    queryFn: async () => (await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })).data === true,
  });

  const signOut = async () => {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };

  if (isAdmin.isLoading) return <div className="grid min-h-screen place-items-center bg-sky">Loading…</div>;
  if (!isAdmin.data)
    return (
      <div className="grid min-h-screen place-items-center bg-sky px-4">
        <div className="glass max-w-sm space-y-4 rounded-3xl p-8 text-center">
          <p>This account doesn't have owner access.</p>
          <Button onClick={signOut}>Sign out</Button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-sky px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-gradient">Control room</h1>
          <div className="flex-1" />
          <Button asChild variant="secondary"><Link to="/"><ExternalLink /> View site</Link></Button>
          <Button variant="ghost" onClick={signOut}><LogOut /> Sign out</Button>
        </header>
        <Tabs defaultValue="profile" className="glass rounded-3xl p-4 sm:p-6">
          <TabsList className="flex h-auto flex-wrap justify-start bg-secondary">
            {["profile", "theme", "sections", "cards", "links", "projects", "gallery", "music", "timeline", "guestbook", "analytics"].map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>
            ))}
          </TabsList>
          <div className="mt-6">
            <SettingsTabs />
            <TabsContent value="cards"><CrudManager table="cards" defaults={{ title: "New card", category: "Custom", icon: "Sparkles" }}
              fields={[F("title", "Title"), F("category", "Category (Goals, Achievements…)"), F("icon", "Icon", "icon"), F("body", "Text", "textarea")]} /></TabsContent>
            <TabsContent value="links"><CrudManager table="links" defaults={{ title: "New link", url: "https://", icon: "auto" }}
              fields={[F("title", "Title"), F("url", "URL", "url"), F("icon", "Icon", "icon")]} /></TabsContent>
            <TabsContent value="projects"><CrudManager table="projects" defaults={{ title: "New project" }}
              fields={[F("title", "Title"), F("tags", "Tags", "tags"), F("live_url", "Live URL"), F("repo_url", "Repository URL"), F("image_url", "Cover image", "image"), F("description", "Description", "textarea")]} /></TabsContent>
            <TabsContent value="gallery"><CrudManager table="gallery" defaults={{ image_url: "", caption: "", category: "Art" }}
              fields={[F("image_url", "Image", "image"), F("caption", "Caption"), F("category", "Category")]} /></TabsContent>
            <TabsContent value="music"><CrudManager table="tracks" defaults={{ title: "New track", artist: "", audio_url: "" }}
              fields={[F("title", "Title"), F("artist", "Artist"), F("audio_url", "Audio file", "audio"), F("cover_url", "Album art", "image")]} /></TabsContent>
            <TabsContent value="timeline"><CrudManager table="timeline" defaults={{ title: "Milestone", date_label: "2026" }}
              fields={[F("date_label", "Date"), F("title", "Title"), F("body", "Details", "textarea")]} /></TabsContent>
            <TabsContent value="guestbook"><GuestbookAdmin /></TabsContent>
            <TabsContent value="analytics"><Analytics /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1 text-xs text-muted-foreground">{label}{children}</label>;
}

function SettingsTabs() {
  const qc = useQueryClient();
  const { data } = useQuery(settingsQuery);
  const [s, setS] = useState<SiteData | null>(null);
  useEffect(() => { if (data) setS(data); }, [data]);
  if (!s) return null;
  const save = async () => {
    const { error } = await supabase.from("site_settings").update({ data: s as any, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) { toast.error(error.message); return; }
    toast.success("Site updated"); qc.invalidateQueries({ queryKey: ["site_settings"] });
  };
  const P = (k: keyof SiteData["profile"], v: any) => setS({ ...s, profile: { ...s.profile, [k]: v } });
  const T = (k: keyof SiteData["theme"], v: any) => setS({ ...s, theme: { ...s.theme, [k]: v } });
  const moveSec = (i: number, d: number) => {
    const arr = [...s.sections]; const j = i + d; if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; setS({ ...s, sections: arr });
  };
  const saveBtn = <Button className="mt-6" onClick={save}>Save changes</Button>;

  return (
    <>
      <TabsContent value="profile">
        <div className="grid gap-4 md:grid-cols-2">
          <L label="Display name"><Input value={s.profile.name} onChange={(e) => P("name", e.target.value)} /></L>
          <L label="Handle"><Input value={s.profile.handle} onChange={(e) => P("handle", e.target.value)} /></L>
          <L label="Status">
            <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground" value={s.profile.status} onChange={(e) => P("status", e.target.value)}>
              {["online", "coding", "gaming", "away", "custom"].map((x) => <option key={x} value={x} className="bg-popover">{x}</option>)}
            </select>
          </L>
          <L label="Status message"><Input value={s.profile.statusMessage} onChange={(e) => P("statusMessage", e.target.value)} /></L>
          <L label="Location"><Input value={s.profile.location} onChange={(e) => P("location", e.target.value)} /></L>
          <L label="Time zone (e.g. Asia/Dhaka)"><Input value={s.profile.timezone} onChange={(e) => P("timezone", e.target.value)} /></L>
          <L label="Tags / roles (comma separated)"><Input value={s.profile.tags.join(", ")} onChange={(e) => P("tags", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} /></L>
          <label className="flex items-center gap-2 text-sm"><Switch checked={s.profile.verified} onCheckedChange={(v) => P("verified", v)} /> Verified badge</label>
          <L label="Avatar"><div className="flex gap-2"><Input value={s.profile.avatar} onChange={(e) => P("avatar", e.target.value)} /><UploadButton accept="image/*" onDone={(u) => P("avatar", u)} /></div></L>
          <L label="Banner"><div className="flex gap-2"><Input value={s.profile.banner} onChange={(e) => P("banner", e.target.value)} /><UploadButton accept="image/*" onDone={(u) => P("banner", u)} /></div></L>
          <div className="md:col-span-2"><L label="Bio"><Textarea rows={4} value={s.profile.bio} onChange={(e) => P("bio", e.target.value)} /></L></div>
          <div className="md:col-span-2"><L label="Rotating quotes (one per line)"><Textarea rows={4} value={s.profile.quotes.join("\n")} onChange={(e) => P("quotes", e.target.value.split("\n").filter((x) => x.trim()))} /></L></div>
        </div>
        {saveBtn}
      </TabsContent>

      <TabsContent value="theme">
        <div className="grid gap-5 md:grid-cols-2">
          <L label="Background">
            <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground" value={s.theme.background} onChange={(e) => T("background", e.target.value)}>
              {["particles", "gradient", "image", "video"].map((x) => <option key={x} value={x} className="bg-popover">{x}</option>)}
            </select>
          </L>
          <L label="Accent color"><Input type="color" value={s.theme.accent} onChange={(e) => T("accent", e.target.value)} className="h-9 p-1" /></L>
          <L label="Background image"><div className="flex gap-2"><Input value={s.theme.bgImage} onChange={(e) => T("bgImage", e.target.value)} /><UploadButton accept="image/*" onDone={(u) => T("bgImage", u)} /></div></L>
          <L label="Background video"><div className="flex gap-2"><Input value={s.theme.bgVideo} onChange={(e) => T("bgVideo", e.target.value)} /><UploadButton accept="video/*" onDone={(u) => T("bgVideo", u)} /></div></L>
          <L label="Font">
            <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground" value={s.theme.font} onChange={(e) => T("font", e.target.value)}>
              {["space", "syne", "mono", "serif"].map((x) => <option key={x} value={x} className="bg-popover">{x}</option>)}
            </select>
          </L>
          <label className="flex items-center gap-2 text-sm"><Switch checked={s.theme.glow} onCheckedChange={(v) => T("glow", v)} /> Glowing borders</label>
          <L label={`Glass transparency: ${Math.round(s.theme.glass * 100)}%`}><Slider value={[s.theme.glass]} min={0} max={0.4} step={0.01} onValueChange={([v]) => T("glass", v)} /></L>
          <L label={`Blur: ${s.theme.blur}px`}><Slider value={[s.theme.blur]} min={0} max={60} step={1} onValueChange={([v]) => T("blur", v)} /></L>
          <label className="flex items-center gap-2 text-sm"><Switch checked={s.player.enabled} onCheckedChange={(v) => setS({ ...s, player: { enabled: v } })} /> Show music player</label>
        </div>
        {saveBtn}
      </TabsContent>

      <TabsContent value="sections">
        <div className="space-y-2">
          {s.sections.map((sec, i) => (
            <div key={sec.key} className="tile flex items-center gap-3 p-3">
              <Switch checked={sec.enabled} onCheckedChange={(v) => setS({ ...s, sections: s.sections.map((x, j) => (j === i ? { ...x, enabled: v } : x)) })} />
              <Input className="max-w-xs" value={sec.label} onChange={(e) => setS({ ...s, sections: s.sections.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
              <span className="text-xs text-muted-foreground">{sec.key}</span>
              <div className="flex-1" />
              <Button size="icon" variant="ghost" aria-label="Move up" onClick={() => moveSec(i, -1)}><ArrowUp /></Button>
              <Button size="icon" variant="ghost" aria-label="Move down" onClick={() => moveSec(i, 1)}><ArrowDown /></Button>
            </div>
          ))}
        </div>
        {saveBtn}
      </TabsContent>
    </>
  );
}

function GuestbookAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery(tableQuery("guestbook"));
  const refresh = () => qc.invalidateQueries({ queryKey: ["table", "guestbook"] });
  if (!data.length) return <p className="text-sm text-muted-foreground">No messages yet.</p>;
  return (
    <div className="space-y-2">
      {data.map((g) => (
        <div key={g.id} className="tile flex items-start gap-3 p-3">
          <div className="flex-1">
            <div className="text-sm font-semibold">{g.name} <span className="text-xs font-normal text-muted-foreground">{new Date(g.created_at).toLocaleString()}</span></div>
            <p className="text-sm text-muted-foreground">{g.message}</p>
          </div>
          <label className="flex items-center gap-2 text-xs">Approved
            <Switch checked={g.visible} onCheckedChange={async (v) => { await supabase.from("guestbook").update({ visible: v }).eq("id", g.id); refresh(); }} /></label>
          <Button size="sm" variant="ghost" onClick={async () => { await supabase.from("guestbook").delete().eq("id", g.id); refresh(); }}>Delete</Button>
        </div>
      ))}
    </div>
  );
}

function Analytics() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const total = await supabase.from("page_views").select("*", { count: "exact", head: true });
      const since = new Date(Date.now() - 7 * 864e5).toISOString();
      const week = await supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", since);
      const recent = await supabase.from("page_views").select("*").order("created_at", { ascending: false }).limit(20);
      return { total: total.count ?? 0, week: week.count ?? 0, recent: recent.data ?? [] };
    },
  });
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="tile p-5"><div className="text-xs text-muted-foreground">All-time views</div><div className="font-display text-4xl font-bold text-primary">{data?.total ?? "–"}</div></div>
        <div className="tile p-5"><div className="text-xs text-muted-foreground">Last 7 days</div><div className="font-display text-4xl font-bold text-primary">{data?.week ?? "–"}</div></div>
      </div>
      <div className="tile divide-y divide-border">
        {data?.recent.map((v) => (
          <div key={v.id} className="flex justify-between p-3 text-sm">
            <span>{new Date(v.created_at!).toLocaleString()}</span>
            <span className="truncate text-muted-foreground">{v.referrer || "direct"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
