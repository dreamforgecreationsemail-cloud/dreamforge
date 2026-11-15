import { useServerFn } from "@tanstack/react-start";
import { askCouncil } from "@/lib/council.functions";
import { useRef, useState } from "react";
import { ArrowLeft, Download, FilePlus2, Save, Trash2, Paperclip, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { MODES } from "@/lib/dreamforge";
import { createResult, initialValues, validateValues, WORKFLOWS, type CoreModeId } from "@/lib/workflows";
import { downloadText, draftTitle, useWorkspace } from "./workspace";

const tasks = ["Confirm destination link", "Review platform rules and permissions", "Publish manually", "Record results"];
export function ModeWorkflow({ mode }: { mode: CoreModeId }) {
  const ask = useServerFn(askCouncil);
  const [busy, setBusy] = useState(false);
  const activeRequest = useRef(0);
  const w = WORKFLOWS[mode]; const metadata = MODES.find((m) => m.id === mode);
  const { forms, setForm, drafts, save, remove } = useWorkspace();
  const values = forms[mode] ?? initialValues(mode);
  const [result, setResult] = useState(""); const [id, setId] = useState<string | undefined>();
  const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const [completed, setCompleted] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]); const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const reset = () => { activeRequest.current++; setBusy(false); setForm(mode, initialValues(mode)); setResult(""); setId(undefined); setFiles([]); setCompleted([]); setError(""); setMessage("New draft started."); };
  const privateNote = mode === "brainstorm" && values["kind"] === "Real Talk (private)";
  return <main className="px-7 pb-12 pt-5 space-y-6">
    <div className="flex items-center justify-between gap-3"><Button asChild variant="outline"><Link to="/"><ArrowLeft />All modes</Link></Button><Button variant="ghost" onClick={reset}><FilePlus2 />New draft</Button></div>
    <header className="space-y-3">
      {metadata && <img src={metadata.img} alt={metadata.title} className="aspect-[16/7] w-full object-cover rounded-sm" />}
      <h1 className="font-display text-3xl">{metadata?.title}</h1><h2 className="text-xl font-bold">{w.title}</h2>
      <p className="availability border-l-2 border-border pl-3 text-sm text-muted-foreground">{mode === "brainstorm" && values.kind === "Talk it through" ? "Organize notes sends these project fields to DeepSeek for a finished plan." : w.status}</p>
    </header>
    <nav aria-label="Switch mode" className="flex flex-wrap gap-1">{MODES.map((m) => <Button key={m.id} asChild size="sm" variant={mode === m.id ? "secondary" : "ghost"}><Link to="/modes/$mode" params={{ mode: m.id }} aria-current={mode === m.id ? "page" : undefined}>{m.title}</Link></Button>)}</nav>
    <form className="space-y-4" noValidate onSubmit={async (e) => { e.preventDefault(); const problem = validateValues(mode, values); if (problem) { setError(problem); setMessage(""); return; } if (mode === "brainstorm" && values.kind === "Talk it through") {
      if (busy) return;
      const request = ++activeRequest.current;
      setBusy(true); setResult(""); setError(""); setMessage("Working…");
      try {
        const reply = await ask({ data: { text: createResult(mode, values), files: [] } });
        if (request !== activeRequest.current) return;
        if (reply.error) setError(reply.error);
        else setResult(reply.answer);
        setMessage("");
      } catch { if (request === activeRequest.current) { setError("Could not finish this request. Please try again."); setMessage(""); } }
      finally { if (request === activeRequest.current) setBusy(false); }
      return;
    }
    const text = createResult(mode, values); setResult(text); setError(""); setMessage(mode === "money" ? "Estimate calculated from your inputs." : "Text draft created from your inputs. No AI generation was performed."); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); }}>
      {w.fields.map((f) => <div key={f.key} className="space-y-1.5"><label htmlFor={f.key} className="text-base font-bold">{f.label}{f.required && <span className="text-muted-foreground"> *</span>}</label>
        {f.type === "select" ? <Select value={values[f.key] ?? ""} onValueChange={(value) => { activeRequest.current++; setBusy(false); setForm(mode, { ...values, [f.key]: value }); setResult(""); setId(undefined); setCompleted([]); }}><SelectTrigger id={f.key}><SelectValue /></SelectTrigger><SelectContent>{f.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select> : f.type === "textarea" ? <Textarea id={f.key} required={f.required} value={values[f.key] ?? ""} rows={3} onChange={(e) => { activeRequest.current++; setBusy(false); setForm(mode, { ...values, [f.key]: e.target.value }); setResult(""); setMessage(""); }} /> : <Input id={f.key} type={f.type ?? "text"} step={f.key === "quantity" ? "1" : "any"} min={f.min} max={f.max} required={f.required} value={values[f.key] ?? ""} onChange={(e) => { activeRequest.current++; setBusy(false); setForm(mode, { ...values, [f.key]: e.target.value }); setResult(""); setMessage(""); }} />}
      </div>)}
      {(mode === "music" || mode === "picture" || mode === "video") && <div className="space-y-2" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFiles((old) => [...old, ...Array.from(e.dataTransfer.files)]); }}>
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}><Paperclip />Add reference files</Button><input ref={fileRef} hidden multiple type="file" onChange={(e) => { setFiles((old) => [...old, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }} />
        {files.map((f, i) => <div key={`${f.name}-${i}`} className="flex items-center gap-2 text-sm"><span className="min-w-0 flex-1 break-all">{f.name} · {Math.ceil(f.size / 1024)} KB</span><Button variant="ghost" size="icon" type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((old) => old.filter((_, n) => n !== i))}><X /></Button></div>)}
        <p className="text-sm text-muted-foreground">References are session-only; files are not analyzed or included in draft downloads.</p>
      </div>}
      {error && <p role="alert" className="text-destructive">{error}</p>}<Button disabled={busy} type="submit" className="w-full build-btn">{w.action}</Button>
    </form>
    <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{message}</p>
    {result && <section ref={resultRef} className="space-y-3 scroll-mt-4 border-t border-border pt-5"><h2 className="font-display text-lg">{mode === "money" ? "Price estimate" : "Editable draft"}</h2><Textarea aria-label="Draft result" rows={15} value={result} onChange={(e) => { setResult(e.target.value); setMessage("Edited — save this draft again to keep your changes in this session."); }} />
      {mode === "marketing" && <div className="space-y-3">{tasks.map((task) => <label key={task} className="flex gap-3 items-center"><Checkbox checked={completed.includes(task)} onCheckedChange={(checked) => setCompleted((old) => checked ? [...old, task] : old.filter((t) => t !== task))} />{task}</label>)}</div>}
      <div className="flex flex-wrap gap-2"><Button onClick={() => { const draftId = id ?? crypto.randomUUID(); setId(draftId); save({ id: draftId, mode, values: { ...values }, result, completed, updated: new Date().toISOString() }); setMessage(privateNote ? "Private note saved for this session, separate from project drafts. Download to keep it after closing." : "Draft saved for this session. Download the backup before closing or refreshing."); }}><Save />Save draft</Button><Button variant="outline" onClick={() => downloadText(result, `${mode}-draft.txt`)}><Download />Download text</Button></div>
    </section>}
    <section className="border-t border-border pt-5 space-y-3"><h2 className="font-display text-lg">Session drafts</h2><p className="text-sm text-muted-foreground">Drafts disappear on refresh or close. Download and restore backups from All modes. No cloud uploads.</p>
      {drafts.filter((d) => d.mode === mode && (mode !== "brainstorm" || (d.values["kind"] === "Real Talk (private)") === privateNote)).map((d) => <article key={d.id} className="border border-border rounded-sm p-3 flex items-center gap-2"><Button variant="ghost" className="h-auto min-w-0 flex-1 justify-start whitespace-normal text-left" onClick={() => { activeRequest.current++; setBusy(false); setForm(mode, d.values); setResult(d.result); setId(d.id); setCompleted(d.completed); setFiles([]); setError(""); setMessage("Draft opened."); }}>{draftTitle(d)}</Button><Button variant="ghost" size="icon" aria-label={`Delete ${draftTitle(d)}`} onClick={() => { remove(d.id); if (id === d.id) reset(); setMessage("Draft deleted from this session."); }}><Trash2 /></Button></article>)}
    </section>
  </main>;
}