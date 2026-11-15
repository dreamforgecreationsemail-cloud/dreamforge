import { createContext, useContext, useState, type ReactNode } from "react";
import { z } from "zod";
import { WORKFLOWS, type CoreModeId, type Values } from "@/lib/workflows";

const draftSchema = z.object({ id: z.string(), mode: z.enum(["music", "picture", "video", "brainstorm", "marketing", "teacher", "money"]), values: z.record(z.string()), result: z.string(), updated: z.string(), completed: z.array(z.string()).default([]) });
export type Draft = z.infer<typeof draftSchema>;
export function parseDrafts(text: string): Draft[] { return z.array(draftSchema).max(500).parse(JSON.parse(text)); }
export function downloadText(text: string, name: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
interface Workspace { drafts: Draft[]; save: (draft: Draft) => void; remove: (id: string) => void; restore: (drafts: Draft[]) => void; forms: Partial<Record<CoreModeId, Values>>; setForm: (mode: CoreModeId, values: Values) => void }
const Context = createContext<Workspace | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [forms, setForms] = useState<Workspace["forms"]>({});
  return <Context.Provider value={{ drafts, forms, setForm: (mode, values) => setForms((old) => ({ ...old, [mode]: values })), save: (draft) => setDrafts((old) => [draft, ...old.filter((d) => d.id !== draft.id)]), remove: (id) => setDrafts((old) => old.filter((d) => d.id !== id)), restore: (items) => setDrafts((old) => [...items, ...old.filter((d) => !items.some((i) => i.id === d.id))]) }}>{children}</Context.Provider>;
}
export function useWorkspace() { const value = useContext(Context); if (!value) throw new Error("Workspace is missing"); return value; }
export function draftTitle(draft: Draft) { return draft.values["title"] || WORKFLOWS[draft.mode].title; }