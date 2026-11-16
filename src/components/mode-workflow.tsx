import { useServerFn } from "@tanstack/react-start";
import { askCouncil } from "@/lib/council.functions";
import { useRef, useState } from "react";
import { ArrowLeft, Download, FilePlus2, Save, Trash2, Paperclip, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { MODES } from "@/lib/dreamforge";
import {
  createResult,
  findValidationIssue,
  formatValidationIssue,
  initialValues,
  WORKFLOWS,
  type CoreModeId,
  type ValidationIssue,
} from "@/lib/workflows";
import { useWorkspace, downloadText, type Draft } from "./workspace";
import { LanguageSwitcher } from "./language-switcher";
import { useDocumentTitle, useI18n } from "./use-i18n";
import {
  optionLabel,
  TASK_IDS,
  TASK_KEYS,
  translate,
  translateKnownError,
  type MessageKey,
} from "@/lib/i18n/catalog";

const selectClass =
  "h-auto min-h-9 whitespace-normal py-2 text-left [&>span]:line-clamp-none [&>span]:whitespace-normal";

type NoticeId =
  | ""
  | "working"
  | "estimate"
  | "draft"
  | "edited"
  | "privateSaved"
  | "saved"
  | "opened"
  | "deleted"
  | "fresh";

const NOTICES: Record<Exclude<NoticeId, "">, MessageKey> = {
  working: "modeUi.working",
  estimate: "modeUi.estimateDone",
  draft: "modeUi.draftDone",
  edited: "modeUi.edited",
  privateSaved: "modeUi.privateSaved",
  saved: "modeUi.draftSaved",
  opened: "modeUi.draftOpened",
  deleted: "modeUi.draftDeleted",
  fresh: "modeUi.newDraftStarted",
};

type FormError =
  { kind: "validation"; issue: ValidationIssue } | { kind: "message"; text: string } | null;

export function ModeWorkflow({ mode }: { mode: CoreModeId }) {
  const ask = useServerFn(askCouncil);
  const { locale, t, text } = useI18n();
  useDocumentTitle(
    translate(locale, "meta.modeTitle", {
      title: translate(locale, `workflow.${mode}.title` as MessageKey),
    }),
  );
  const [busy, setBusy] = useState(false);
  const activeRequest = useRef(0);
  const w = WORKFLOWS[mode];
  const metadata = MODES.find((m) => m.id === mode);
  const { forms, setForm, drafts, save, remove } = useWorkspace();
  const values = forms[mode] ?? initialValues(mode);
  const [result, setResult] = useState("");
  const [id, setId] = useState<string | undefined>();
  const [notice, setNotice] = useState<NoticeId>("");
  const [error, setError] = useState<FormError>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const privateNote = mode === "brainstorm" && values["kind"] === "Real Talk (private)";
  const talk = mode === "brainstorm" && values["kind"] === "Talk it through";

  const reset = () => {
    activeRequest.current++;
    setBusy(false);
    setForm(mode, initialValues(mode));
    setResult("");
    setId(undefined);
    setFiles([]);
    setCompleted([]);
    setError(null);
    setNotice("fresh");
  };

  const titleFor = (draft: Draft) =>
    draft.values["title"]?.trim() || text(`workflow.${draft.mode}.title`);
  const errorText =
    error?.kind === "validation"
      ? formatValidationIssue(mode, error.issue, locale)
      : error?.kind === "message"
        ? translateKnownError(locale, error.text)
        : "";
  const noticeText = notice ? t(NOTICES[notice]) : "";

  return (
    <main className="space-y-6 px-7 pb-12 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" className="h-auto min-h-9 whitespace-normal">
          <Link to="/">
            <ArrowLeft />
            {t("modeUi.allModes")}
          </Link>
        </Button>
        <Button variant="ghost" className="h-auto min-h-9 whitespace-normal" onClick={reset}>
          <FilePlus2 />
          {t("modeUi.newDraft")}
        </Button>
      </div>
      <LanguageSwitcher />
      <header className="space-y-3">
        {metadata && (
          <img
            src={metadata.img}
            alt={text(`mode.${metadata.id}.title`)}
            className="aspect-[16/7] w-full rounded-sm object-cover"
          />
        )}
        <h1 className="font-display text-3xl leading-tight break-words">
          {metadata ? text(`mode.${metadata.id}.title`) : ""}
        </h1>
        <h2 className="text-xl font-bold leading-snug break-words">
          {text(`workflow.${mode}.title`)}
        </h2>
        <p className="availability border-l-2 border-border pl-3 text-sm leading-snug text-muted-foreground">
          {talk ? t("workflow.brainstorm.talkStatus") : text(`workflow.${mode}.status`)}
        </p>
      </header>
      <nav aria-label={t("modeUi.switchMode")} className="flex flex-wrap gap-1">
        {MODES.map((m) => (
          <Button
            key={m.id}
            asChild
            size="sm"
            variant={mode === m.id ? "secondary" : "ghost"}
            className="h-auto min-h-8 whitespace-normal"
          >
            <Link
              to="/modes/$mode"
              params={{ mode: m.id }}
              aria-current={mode === m.id ? "page" : undefined}
            >
              {text(`mode.${m.id}.title`)}
            </Link>
          </Button>
        ))}
      </nav>
      <form
        className="space-y-4"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const issue = findValidationIssue(mode, values);
          if (issue) {
            setError({ kind: "validation", issue });
            setNotice("");
            return;
          }
          if (talk) {
            if (busy) return;
            const request = ++activeRequest.current;
            setBusy(true);
            setResult("");
            setError(null);
            setNotice("working");
            try {
              const reply = await ask({
                data: { text: createResult(mode, values, locale), files: [] },
              });
              if (request !== activeRequest.current) return;
              if (reply.error) setError({ kind: "message", text: reply.error });
              else setResult(reply.answer);
              setNotice("");
            } catch {
              if (request === activeRequest.current) {
                setError({
                  kind: "message",
                  text: "Could not finish this request. Please try again.",
                });
                setNotice("");
              }
            } finally {
              if (request === activeRequest.current) setBusy(false);
            }
            return;
          }
          const textResult = createResult(mode, values, locale);
          setResult(textResult);
          setError(null);
          setNotice(mode === "money" ? "estimate" : "draft");
          setTimeout(
            () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
            0,
          );
        }}
      >
        {w.fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <label htmlFor={f.key} className="text-base font-bold leading-snug">
              {text(`field.${mode}.${f.key}`)}
              {f.required && <span className="text-muted-foreground"> *</span>}
            </label>
            {f.type === "select" ? (
              <Select
                value={values[f.key] ?? ""}
                onValueChange={(value) => {
                  activeRequest.current++;
                  setBusy(false);
                  setForm(mode, { ...values, [f.key]: value });
                  setResult("");
                  setId(undefined);
                  setCompleted([]);
                }}
              >
                <SelectTrigger id={f.key} className={selectClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-w-[min(100vw-1.5rem,28rem)]">
                  {f.options?.map((o) => (
                    <SelectItem key={o} value={o} className="whitespace-normal">
                      {optionLabel(locale, o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : f.type === "textarea" ? (
              <Textarea
                id={f.key}
                required={f.required}
                value={values[f.key] ?? ""}
                rows={3}
                onChange={(e) => {
                  activeRequest.current++;
                  setBusy(false);
                  setForm(mode, { ...values, [f.key]: e.target.value });
                  setResult("");
                  setNotice("");
                }}
              />
            ) : (
              <Input
                id={f.key}
                type={f.type ?? "text"}
                step={f.key === "quantity" ? "1" : "any"}
                min={f.min}
                max={f.max}
                required={f.required}
                value={values[f.key] ?? ""}
                onChange={(e) => {
                  activeRequest.current++;
                  setBusy(false);
                  setForm(mode, { ...values, [f.key]: e.target.value });
                  setResult("");
                  setNotice("");
                }}
              />
            )}
          </div>
        ))}
        {(mode === "music" || mode === "picture" || mode === "video") && (
          <div
            className="space-y-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setFiles((old) => [...old, ...Array.from(e.dataTransfer.files)]);
            }}
          >
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-9 whitespace-normal"
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip />
              {t("modeUi.addFiles")}
            </Button>
            <input
              ref={fileRef}
              hidden
              multiple
              type="file"
              onChange={(e) => {
                setFiles((old) => [...old, ...Array.from(e.target.files ?? [])]);
                e.target.value = "";
              }}
            />
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 break-all">
                  {t("modeUi.fileLine", { name: f.name, size: Math.ceil(f.size / 1024) })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  aria-label={t("modeUi.removeFile", { name: f.name })}
                  onClick={() => setFiles((old) => old.filter((_, n) => n !== i))}
                >
                  <X />
                </Button>
              </div>
            ))}
            <p className="text-sm leading-snug text-muted-foreground">
              {t("modeUi.referencesHelp")}
            </p>
          </div>
        )}
        {errorText && (
          <p role="alert" className="text-destructive">
            {errorText}
          </p>
        )}
        <Button
          disabled={busy}
          type="submit"
          className="build-btn h-auto min-h-10 w-full whitespace-normal py-3 text-center leading-snug"
        >
          {text(`workflow.${mode}.action`)}
        </Button>
      </form>
      <p role="status" aria-live="polite" className="text-sm leading-snug text-muted-foreground">
        {noticeText}
      </p>
      {result && (
        <section ref={resultRef} className="scroll-mt-4 space-y-3 border-t border-border pt-5">
          <h2 className="font-display text-lg leading-tight">
            {mode === "money" ? t("modeUi.priceEstimate") : t("modeUi.editableDraft")}
          </h2>
          <Textarea
            aria-label={t("modeUi.draftResult")}
            rows={15}
            value={result}
            onChange={(e) => {
              setResult(e.target.value);
              setNotice("edited");
            }}
          />
          {mode === "marketing" && (
            <div className="space-y-3">
              {TASK_IDS.map((task) => (
                <label key={task} className="flex items-start gap-3 leading-snug">
                  <Checkbox
                    checked={completed.includes(task)}
                    onCheckedChange={(checked) =>
                      setCompleted((old) =>
                        checked ? [...old, task] : old.filter((item) => item !== task),
                      )
                    }
                  />
                  <span>{t(TASK_KEYS[task])}</span>
                </label>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              className="h-auto min-h-9 whitespace-normal"
              onClick={() => {
                const draftId = id ?? crypto.randomUUID();
                setId(draftId);
                save({
                  id: draftId,
                  mode,
                  values: { ...values },
                  result,
                  completed,
                  updated: new Date().toISOString(),
                });
                setNotice(privateNote ? "privateSaved" : "saved");
              }}
            >
              <Save />
              {t("modeUi.saveDraft")}
            </Button>
            <Button
              variant="outline"
              className="h-auto min-h-9 whitespace-normal"
              onClick={() => downloadText(result, `${mode}-draft.txt`)}
            >
              <Download />
              {t("modeUi.downloadText")}
            </Button>
          </div>
        </section>
      )}
      <section className="space-y-3 border-t border-border pt-5">
        <h2 className="font-display text-lg leading-tight">{t("modeUi.sessionDrafts")}</h2>
        <p className="text-sm leading-snug text-muted-foreground">
          {t("modeUi.sessionDraftsHelp")}
        </p>
        {drafts
          .filter(
            (d) =>
              d.mode === mode &&
              (mode !== "brainstorm" ||
                (d.values["kind"] === "Real Talk (private)") === privateNote),
          )
          .map((d) => (
            <article
              key={d.id}
              className="flex items-center gap-2 rounded-sm border border-border p-3"
            >
              <Button
                variant="ghost"
                className="h-auto min-w-0 flex-1 justify-start whitespace-normal text-left"
                onClick={() => {
                  activeRequest.current++;
                  setBusy(false);
                  setForm(mode, d.values);
                  setResult(d.result);
                  setId(d.id);
                  setCompleted(d.completed);
                  setFiles([]);
                  setError(null);
                  setNotice("opened");
                }}
              >
                {titleFor(d)}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("modeUi.deleteDraft", { name: titleFor(d) })}
                onClick={() => {
                  remove(d.id);
                  if (id === d.id) reset();
                  setNotice("deleted");
                }}
              >
                <Trash2 />
              </Button>
            </article>
          ))}
      </section>
    </main>
  );
}
