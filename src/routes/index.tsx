import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, Upload, LockKeyhole } from "lucide-react";
import logo from "@/assets/dreamforge-logo.jpg";
import backdrop from "@/assets/wet-wall-backdrop.jpg";
import { MODES, KIDS, CREW, type Mode } from "@/lib/dreamforge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadText, parseDrafts, useWorkspace } from "@/components/workspace";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useDocumentTitle, useI18n } from "@/components/use-i18n";
import { translate } from "@/lib/i18n/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DreamForge Creations Inc. · Your workshop" },
      {
        name: "description",
        content:
          "Seven private, device-only workspaces for song outlines, picture briefs, storyboards, notes, campaigns, research and price estimates.",
      },
      { property: "og:title", content: "DreamForge Creations Inc. · Your workshop" },
      {
        property: "og:description",
        content: "Plan and organize your creative work with seven DreamForge workspaces.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function MetalBlock({ mode, big }: { mode: Mode; big?: boolean }) {
  const { text } = useI18n();
  return (
    <Button
      asChild
      variant="ghost"
      className={`metal-block float-y group h-auto whitespace-normal ${big ? "col-span-2" : ""}`}
    >
      <Link to="/modes/$mode" params={{ mode: mode.id }}>
        <span className="rivet left-2 top-2" />
        <span className="rivet right-2 top-2" />
        <span className="rivet left-2 bottom-2" />
        <span className="rivet right-2 bottom-2" />
        <div className="neon-frame">
          <img
            src={mode.img}
            alt=""
            loading="lazy"
            className={`w-full object-cover ${big ? "h-40" : "h-24"}`}
          />
        </div>
        <div className="mt-2 text-left">
          <div className="font-display text-lg leading-tight break-words">
            {text(`mode.${mode.id}.title`)}
          </div>
          <div className="text-xs leading-snug text-muted-foreground break-words">
            {text(`mode.${mode.id}.tag`)}
          </div>
        </div>
      </Link>
    </Button>
  );
}

type BackupNotice =
  | { kind: "none" }
  | { kind: "noExports" }
  | { kind: "downloaded"; count: number; includePrivate: boolean }
  | { kind: "tooLarge" }
  | { kind: "restored"; count: number }
  | { kind: "failed" };

function Home() {
  const { drafts, restore } = useWorkspace();
  const { locale, t, text, tn } = useI18n();
  useDocumentTitle(translate(locale, "meta.homeTitle"));
  const [notice, setNotice] = useState<BackupNotice>({ kind: "none" });
  const [includePrivate, setIncludePrivate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const center = MODES.find((m) => m.id === "brainstorm");
  const others = MODES.filter((m) => m.id !== "brainstorm");
  const projects = drafts.filter((d) => d.values["kind"] !== "Real Talk (private)");
  const message =
    notice.kind === "none"
      ? ""
      : notice.kind === "noExports"
        ? t("home.noExports")
        : notice.kind === "downloaded"
          ? notice.includePrivate
            ? tn("home.downloadedAll_one", "home.downloadedAll_other", notice.count)
            : tn("home.downloadedProjects_one", "home.downloadedProjects_other", notice.count)
          : notice.kind === "tooLarge"
            ? t("home.tooLarge")
            : notice.kind === "restored"
              ? tn("home.restored_one", "home.restored_other", notice.count)
              : t("home.restoreFailed");

  return (
    <div className="phone-shell">
      <div className="fixed inset-0 -z-10">
        <img src={backdrop} alt="" className="h-full w-full object-cover" />
        <div className="waterfall" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
      </div>
      <div className="vine vine-left" />
      <div className="vine vine-right" />
      <header className="space-y-3 px-7 pt-4">
        <img
          src={logo}
          alt="DreamForge Creations Inc."
          width={1536}
          height={864}
          className="mx-auto w-full max-w-md float-y"
        />
        <p className="text-center text-sm leading-snug">{t("about.short")}</p>
        <p className="text-center text-xs text-muted-foreground">{t("about.age")}</p>
      </header>
      <main className="space-y-7 px-7 pb-10">
        <section
          className="space-y-3 border-y border-border py-5"
          aria-labelledby="language-heading"
        >
          <h2 id="language-heading" className="font-display text-lg leading-tight">
            {t("settings.language")}
          </h2>
          <LanguageSwitcher labelId="language-heading" showHelp />
        </section>
        <div className="grid grid-cols-2 gap-4">
          {others.slice(0, 2).map((m) => (
            <MetalBlock key={m.id} mode={m} />
          ))}
          {center && <MetalBlock big mode={center} />}
          {others.slice(2).map((m) => (
            <MetalBlock key={m.id} mode={m} />
          ))}
        </div>
        <section className="space-y-3 border-y border-border py-5">
          <h2 className="font-display text-lg leading-tight break-words">
            {tn("home.session_one", "home.session_other", projects.length)}
          </h2>
          <p className="text-sm leading-snug text-muted-foreground">{t("home.sessionHelp")}</p>
          <label className="flex items-start gap-3 text-sm leading-snug">
            <Checkbox
              checked={includePrivate}
              onCheckedChange={(v) => setIncludePrivate(v === true)}
            />
            <LockKeyhole className="mt-0.5 size-4 shrink-0" />
            <span>{t("home.includePrivate")}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-auto min-h-9 whitespace-normal"
              disabled={drafts.length === 0}
              onClick={() => {
                const items = includePrivate ? drafts : projects;
                if (!items.length) {
                  setNotice({ kind: "noExports" });
                  return;
                }
                downloadText(
                  JSON.stringify(items, null, 2),
                  "dreamforge-backup.json",
                  "application/json",
                );
                setNotice({ kind: "downloaded", count: items.length, includePrivate });
              }}
            >
              <Download />
              {t("home.backup")}
            </Button>
            <Button
              variant="outline"
              className="h-auto min-h-9 whitespace-normal"
              onClick={() => inputRef.current?.click()}
            >
              <Upload />
              {t("home.restore")}
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            hidden
            accept=".json,application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (file.size > 5_000_000) {
                setNotice({ kind: "tooLarge" });
                return;
              }
              try {
                const items = parseDrafts(await file.text());
                restore(items);
                setNotice({ kind: "restored", count: items.length });
              } catch {
                setNotice({ kind: "failed" });
              }
            }}
          />
          <p role="status" className="text-sm leading-snug text-muted-foreground">
            {message}
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-lg leading-tight">{t("home.council")}</h2>
          <p className="text-sm leading-snug text-muted-foreground">{t("home.councilHelp")}</p>
          <div className="grid grid-cols-3 gap-x-3 gap-y-5">
            {CREW.map((c) => (
              <div key={c.id} className="flex min-w-0 flex-col items-center text-center">
                {c.img ? (
                  <img
                    src={c.img}
                    alt={c.name}
                    loading="lazy"
                    className="h-24 w-24 object-contain"
                  />
                ) : (
                  <div className="flex min-h-24 w-full items-center justify-center rounded-sm border border-dashed border-border px-1 py-2 text-center text-[11px] leading-snug text-muted-foreground">
                    {text(`crew.${c.id}.awaiting`)}
                  </div>
                )}
                <div className="chair" />
                <div className="text-sm font-bold">{c.name}</div>
                <div className="break-words text-xs leading-snug text-muted-foreground">
                  {text(`crew.${c.id}.role`)}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="border-t border-border pt-5">
          <h2 className="font-display text-lg leading-tight break-words">
            {text(`mode.${KIDS.id}.title`)}
          </h2>
          <p className="text-sm leading-snug text-muted-foreground">{t("home.kidsHelp")}</p>
        </section>
      </main>
    </div>
  );
}
