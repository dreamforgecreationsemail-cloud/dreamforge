import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, Upload, LockKeyhole } from "lucide-react";
import logo from "@/assets/dreamforge-logo.jpg";
import backdrop from "@/assets/wet-wall-backdrop.jpg";
import { MODES, KIDS, CREW, type Mode } from "@/lib/dreamforge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadText, parseDrafts, useWorkspace } from "@/components/workspace";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "DreamForge Creations Inc. · Your workshop" },
    { name: "description", content: "Seven private, device-only workspaces for song outlines, picture briefs, storyboards, notes, campaigns, research and price estimates." },
    { property: "og:title", content: "DreamForge Creations Inc. · Your workshop" },
    { property: "og:description", content: "Plan and organize your creative work with seven DreamForge workspaces." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});
function MetalBlock({ mode, big }: { mode: Mode; big?: boolean }) {
  return <Button asChild variant="ghost" className={`metal-block float-y group h-auto whitespace-normal ${big ? "col-span-2" : ""}`}>
    <Link to="/modes/$mode" params={{ mode: mode.id }}>
      <span className="rivet left-2 top-2" /><span className="rivet right-2 top-2" /><span className="rivet left-2 bottom-2" /><span className="rivet right-2 bottom-2" />
      <div className="neon-frame"><img src={mode.img} alt="" loading="lazy" className={`w-full object-cover ${big ? "h-40" : "h-24"}`} /></div>
      <div className="mt-2 text-left"><div className="font-display text-lg leading-tight break-words">{mode.title}</div><div className="text-xs text-muted-foreground">{mode.tag}</div></div>
    </Link>
  </Button>;
}
function Home() {
  const { drafts, restore } = useWorkspace();
  const [message, setMessage] = useState(""); const [includePrivate, setIncludePrivate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const center = MODES.find((m) => m.id === "brainstorm");
  const others = MODES.filter((m) => m.id !== "brainstorm");
  const projects = drafts.filter((d) => d.values["kind"] !== "Real Talk (private)");
  return <div className="phone-shell">
    <div className="fixed inset-0 -z-10"><img src={backdrop} alt="" className="h-full w-full object-cover" /><div className="waterfall" /><div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" /></div>
    <div className="vine vine-left" /><div className="vine vine-right" />
    <header className="px-7 pt-4"><img src={logo} alt="DreamForge Creations Inc." width={1536} height={864} className="mx-auto w-full max-w-md float-y" /></header>
    <main className="space-y-7 px-7 pb-10">
      <div className="grid grid-cols-2 gap-4">{others.slice(0, 2).map((m) => <MetalBlock key={m.id} mode={m} />)}{center && <MetalBlock big mode={center} />}{others.slice(2).map((m) => <MetalBlock key={m.id} mode={m} />)}</div>
      <section className="border-y border-border py-5 space-y-3"><h2 className="font-display text-lg">Your session · {projects.length} projects</h2><p className="text-sm text-muted-foreground">Drafts stay in this session only. Download a backup before refreshing or closing. No cloud uploads or AI charges.</p>
        <label className="flex items-center gap-3 text-sm"><Checkbox checked={includePrivate} onCheckedChange={(v) => setIncludePrivate(v === true)} /><LockKeyhole className="size-4" />Include private Real Talk in backup</label>
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={drafts.length === 0} onClick={() => { const items = includePrivate ? drafts : projects; if (!items.length) { setMessage("No project drafts to export. Private notes are excluded."); return; } downloadText(JSON.stringify(items, null, 2), "dreamforge-backup.json", "application/json"); setMessage(`Downloaded ${items.length} drafts${includePrivate ? ", including private notes" : "; private notes excluded"}.`); }}><Download />Backup</Button><Button variant="outline" onClick={() => inputRef.current?.click()}><Upload />Restore backup</Button></div>
        <input ref={inputRef} type="file" hidden accept=".json,application/json" onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; if (file.size > 5_000_000) { setMessage("Backup is too large. Maximum size is 5 MB."); return; } try { const items = parseDrafts(await file.text()); restore(items); setMessage(`Restored ${items.length} drafts to this session.`); } catch { setMessage("Could not restore this file. Choose a valid DreamForge JSON backup."); } }} />
        <p role="status" className="text-sm text-muted-foreground">{message}</p>
      </section>
      <section className="space-y-3"><h2 className="font-display text-lg">The Council</h2><p className="text-sm text-muted-foreground">Crew portraits only. Live crew conversations and the free local brain are not installed in this website.</p><div className="grid grid-cols-3 gap-x-3 gap-y-5">{CREW.map((c) => <div key={c.id} className="flex flex-col items-center text-center">{c.img ? <img src={c.img} alt={c.name} loading="lazy" className="h-24 w-24 object-contain" /> : <div className="flex h-24 w-20 items-center justify-center rounded-sm border border-dashed border-border text-[10px] text-muted-foreground">{c.awaiting}</div>}<div className="chair" /><div className="text-sm font-bold">{c.name}</div><div className="text-xs text-muted-foreground">{c.role}</div></div>)}</div></section>
      <section className="border-t border-border pt-5"><h2 className="font-display text-lg">{KIDS.title}</h2><p className="text-sm text-muted-foreground">Separate build after Jack’s version. Not available in this workshop.</p></section>
    </main>
  </div>;
}
