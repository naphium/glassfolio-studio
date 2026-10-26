import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { tableQuery, uploadMedia, type ContentTable } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DynIcon } from "@/components/site/DynIcon";

export type Field = { key: string; label: string; type: "text" | "textarea" | "url" | "image" | "audio" | "tags" | "icon" };
type Row = Record<string, any>;

export function UploadButton({ accept, onDone }: { accept: string; onDone: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-secondary px-3 py-2 text-xs hover:bg-accent">
      <Upload className="h-3 w-3" /> {busy ? "Uploading…" : "Upload"}
      <input type="file" accept={accept} className="hidden" onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        setBusy(true);
        try { onDone(await uploadMedia(f)); toast.success("Uploaded"); } catch (err: any) { toast.error(err.message); }
        setBusy(false);
      }} />
    </label>
  );
}

function FieldInput({ f, value, onChange }: { f: Field; value: any; onChange: (v: any) => void }) {
  if (f.type === "textarea") return <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  if (f.type === "tags") return <Input value={(value ?? []).join(", ")} placeholder="comma, separated"
    onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />;
  if (f.type === "image" || f.type === "audio")
    return (
      <div className="flex items-center gap-2">
        {f.type === "image" && value && <img src={value} alt="" className="h-10 w-10 rounded object-cover" />}
        <Input value={value ?? ""} placeholder="https://…" onChange={(e) => onChange(e.target.value)} />
        <UploadButton accept={f.type === "image" ? "image/*" : "audio/*"} onDone={onChange} />
      </div>
    );
  if (f.type === "icon")
    return (
      <div className="flex items-center gap-2">
        {value && value !== "auto" && <DynIcon name={value} className="h-5 w-5 text-primary" />}
        <Input value={value ?? ""} placeholder="Lucide name, e.g. Github — or 'auto'" onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  return <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
}

export function CrudManager({ table, fields, defaults }: { table: ContentTable; fields: Field[]; defaults: Row }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery(tableQuery(table));
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => setRows(data), [data]);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["table", table] }); };
  const db = supabase.from(table) as any;

  const add = async () => {
    const { error } = await db.insert({ ...defaults, sort: rows.length });
    if (error) return toast.error(error.message);
    refresh();
  };
  const save = async (r: Row, patch?: Row) => {
    const { id, created_at, ...rest } = { ...r, ...patch };
    const { error } = await db.update(rest).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Saved"); refresh();
  };
  const del = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await db.delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };
  const move = async (i: number, dir: number) => {
    const j = i + dir; if (j < 0 || j >= rows.length) return;
    const a = rows[i], b = rows[j];
    await Promise.all([db.update({ sort: j }).eq("id", a.id), db.update({ sort: i }).eq("id", b.id)]);
    refresh();
  };
  const set = (i: number, k: string, v: any) => setRows((rs) => rs.map((r, x) => (x === i ? { ...r, [k]: v } : r)));

  return (
    <div className="space-y-3">
      <Button onClick={add}><Plus /> Add new</Button>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Nothing here yet.</p>}
      {rows.map((r, i) => (
        <div key={r.id} className="tile space-y-3 p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">#{i + 1}</span>
            <div className="flex-1" />
            <label className="flex items-center gap-2 text-xs">Visible
              <Switch checked={r.visible} onCheckedChange={(v) => save(r, { visible: v })} /></label>
            <Button size="icon" variant="ghost" aria-label="Move up" onClick={() => move(i, -1)}><ArrowUp /></Button>
            <Button size="icon" variant="ghost" aria-label="Move down" onClick={() => move(i, 1)}><ArrowDown /></Button>
            <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => del(r.id)}><Trash2 /></Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {fields.map((f) => (
              <label key={f.key} className={`space-y-1 text-xs text-muted-foreground ${f.type === "textarea" ? "md:col-span-2" : ""}`}>
                {f.label}
                <FieldInput f={f} value={r[f.key]} onChange={(v) => set(i, f.key, v)} />
              </label>
            ))}
          </div>
          <Button size="sm" onClick={() => save(r)}><Save /> Save</Button>
        </div>
      ))}
    </div>
  );
}
