import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, tableQuery } from "@/lib/site";
import { normalize, PRESETS, fetchLanyard, fetchGithub, type FullSite } from "@/lib/extras";
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
            {["profile", "theme", "effects", "integrations", "sections", "cards", "links", "projects", "gallery", "music", "timeline", "guestbook", "analytics"].map((t) => (
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
  const [s, setS] = useState<FullSite | null>(null);
  useEffect(() => { if (data) setS(normalize(data)); }, [data]);
  if (!s) return null;
  const save = async () => {
    const { error } = await supabase.from("site_settings").update({ data: s as any, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) { toast.error(error.message); return; }
    toast.success("Site updated"); qc.invalidateQueries({ queryKey: ["site_settings"] });
  };
  const P = (k: keyof FullSite["profile"], v: any) => setS({ ...s, profile: { ...s.profile, [k]: v } });
  const T = (k: keyof FullSite["theme"], v: any) => setS({ ...s, theme: { ...s.theme, [k]: v } });
  const E = (k: keyof FullSite["effects"], v: any) => setS({ ...s, effects: { ...s.effects, [k]: v } });
  const I = (k: keyof FullSite["integrations"], v: any) => setS({ ...s, integrations: { ...s.integrations, [k]: v } });
  const PL = (k: keyof FullSite["player"], v: any) => setS({ ...s, player: { ...s.player, [k]: v } });
  const applyPreset = (key: string) => {
    const pr = PRESETS[key]!;
    setS({ ...s, theme: { ...s.theme, ...pr.theme, preset: key }, effects: { ...s.effects, overlay: pr.overlay ?? "none" } });
  };
  const testDiscord = async () => { try { const d = await fetchLanyard(s.integrations.discordId); toast.success(`Found ${d.discord_user.username} (${d.discord_status})`); } catch (e: any) { toast.error(e.message + " — join discord.gg/lanyard with this account first."); } };
  const importGithub = async () => {
    try {
      const g = await fetchGithub(s.integrations.githubUser);
      setS({ ...s, profile: { ...s.profile, name: s.profile.name || g.profile.name || g.profile.login, bio: g.profile.bio || s.profile.bio, avatar: s.profile.avatar || g.profile.avatar_url, location: g.profile.location || s.profile.location } });
      toast.success("Pulled profile info from GitHub — review and save.");
    } catch (e: any) { toast.error(e.message); }
  };
  const importRepos = async () => {
    try {
      const g = await fetchGithub(s.integrations.githubUser);
      const rows = g.top.map((r: any, i: number) => ({ title: r.name, description: r.description ?? "", tags: [r.language, ...(r.topics ?? [])].filter(Boolean).slice(0, 5), live_url: r.homepage || null, repo_url: r.html_url, sort: 100 + i }));
      const { error } = await supabase.from("projects").insert(rows);
      if (error) { toast.error(error.message); return; }
      qc.invalidateQueries({ queryKey: ["table", "projects"] });
      toast.success(`Imported ${rows.length} repos as projects`);
    } catch (e: any) { toast.error(e.message); }
  };
  const Toggle = ({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) => (
    <label className="tile flex items-center justify-between gap-2 p-3 text-sm">{label}<Switch checked={on} onCheckedChange={set} /></label>
  );
  const moveSec = (i: number, d: number) => {
    const arr = [...s.sections]; const j = i + d; if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j]!, arr[i]!]; setS({ ...s, sections: arr });
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
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(PRESETS).map(([k, pr]) => (
            <button key={k} onClick={() => applyPreset(k)} className={`tile p-3 text-left text-sm ${s.theme.preset === k ? "border-primary" : ""}`}>
              <span className="mb-2 block h-6 rounded-md" style={{ background: `linear-gradient(120deg, ${pr.theme.accent}, transparent)` }} />
              {pr.label}
            </button>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <L label="Background">
            <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground" value={s.theme.background} onChange={(e) => T("background", e.target.value)}>
              {["particles", "aurora", "matrix", "gradient", "image", "video"].map((x) => <option key={x} value={x} className="bg-popover">{x}</option>)}
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
          <L label={`Glass transparency: ${Math.round(s.theme.glass * 100)}%`}><Slider value={[s.theme.glass]} min={0} max={0.4} step={0.01} onValueChange={([v]) => T("glass", v ?? 0)} /></L>
          <L label={`Blur: ${s.theme.blur}px`}><Slider value={[s.theme.blur]} min={0} max={60} step={1} onValueChange={([v]) => T("blur", v ?? 0)} /></L>
        </div>
        {saveBtn}
      </TabsContent>

      <TabsContent value="effects">
        <div className="grid gap-3 md:grid-cols-2">
          <Toggle label="Cursor glow" on={s.effects.cursorGlow} set={(v) => E("cursorGlow", v)} />
          <Toggle label="3D card tilt" on={s.effects.tilt} set={(v) => E("tilt", v)} />
          <Toggle label="Film grain" on={s.effects.noise} set={(v) => E("noise", v)} />
          <Toggle label="Typewriter roles" on={s.effects.typewriter} set={(v) => E("typewriter", v)} />
          <Toggle label="Click sparks" on={s.effects.clickSparks} set={(v) => E("clickSparks", v)} />
          <L label="Weather / overlay">
            <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground" value={s.effects.overlay} onChange={(e) => E("overlay", e.target.value)}>
              {["none", "snow", "rain", "fireflies", "sakura"].map((x) => <option key={x} value={x} className="bg-popover">{x}</option>)}
            </select>
          </L>
        </div>
        <h3 className="mb-3 mt-8 font-display text-lg font-semibold">Music player</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Toggle label="Show music player" on={s.player.enabled} set={(v) => PL("enabled", v)} />
          <Toggle label="Auto-play music" on={s.player.autoplay} set={(v) => PL("autoplay", v)} />
          <Toggle label="Shuffle" on={s.player.shuffle} set={(v) => PL("shuffle", v)} />
          <L label={`Starting volume: ${Math.round(s.player.volume * 100)}%`}><Slider value={[s.player.volume]} max={1} step={0.05} onValueChange={([v]) => PL("volume", v ?? 0.5)} /></L>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Browsers block sound until a visitor clicks or presses a key, so auto-play starts on their first interaction.</p>
        {saveBtn}
      </TabsContent>

      <TabsContent value="integrations">
        <div className="space-y-6">
          <div className="tile space-y-3 p-4">
            <h3 className="font-semibold">Discord (live presence, games, Spotify)</h3>
            <p className="text-xs text-muted-foreground">Enter your Discord user ID (Settings → Advanced → Developer Mode, then right-click yourself → Copy User ID). Your account must join the free Lanyard server at discord.gg/lanyard for live data.</p>
            <div className="flex gap-2"><Input placeholder="e.g. 94490510688792576" value={s.integrations.discordId} onChange={(e) => I("discordId", e.target.value.trim())} /><Button variant="secondary" onClick={testDiscord}>Test</Button></div>
            <div className="grid gap-2 md:grid-cols-3">
              <Toggle label="Show Discord card" on={s.integrations.showDiscord} set={(v) => I("showDiscord", v)} />
              <Toggle label="Show Spotify" on={s.integrations.showSpotify} set={(v) => I("showSpotify", v)} />
              <Toggle label="Auto status from Discord" on={s.integrations.syncStatusFromDiscord} set={(v) => I("syncStatusFromDiscord", v)} />
            </div>
          </div>
          <div className="tile space-y-3 p-4">
            <h3 className="font-semibold">GitHub</h3>
            <div className="flex flex-wrap gap-2"><Input className="max-w-xs" placeholder="username" value={s.integrations.githubUser} onChange={(e) => I("githubUser", e.target.value.trim())} />
              <Button variant="secondary" onClick={importGithub}>Pull profile info</Button>
              <Button variant="secondary" onClick={importRepos}>Import top repos as projects</Button></div>
            <Toggle label="Show GitHub stats card" on={s.integrations.showGithub} set={(v) => I("showGithub", v)} />
          </div>
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
