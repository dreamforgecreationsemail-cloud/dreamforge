import type { ModeId } from "./dreamforge";
import { translate, type MessageKey } from "./i18n/catalog";
import type { Locale } from "./i18n/locale";
import { renderLocalizedResult } from "./localized-result";

export type CoreModeId = Exclude<ModeId, "kids">;
export type Values = Record<string, string>;
export interface Field {
  key: string;
  label: string;
  type?: "textarea" | "number" | "select" | "date";
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
}
export interface Workflow {
  title: string;
  action: string;
  status: string;
  fields: Field[];
}
const field = (key: string, label: string, type?: Field["type"], required = false): Field => ({
  key,
  label,
  ...(type ? { type } : {}),
  required,
});
export const WORKFLOWS: Record<CoreModeId, Workflow> = {
  music: {
    title: "Song notebook",
    action: "Create song outline",
    status:
      "Song planning works here. Audio generation, voice matching, auto-tune and the built-in beat engine are not connected. The planned on-device Android tools are not installed in this website.",
    fields: [
      field("title", "Song name", undefined, true),
      field("recipient", "Who is it for?"),
      {
        key: "genre",
        label: "Genre",
        type: "select",
        options: ["Hip-hop", "R&B", "Pop", "Rock", "Country", "Electronic", "Other"],
      },
      field("feeling", "Feeling / vibe", undefined, true),
      field("idea", "Story or message", "textarea", true),
      field("hook", "Your hook or lyrics", "textarea"),
      { ...field("bpm", "Tempo (BPM)", "number"), min: 40, max: 240 },
    ],
  },
  picture: {
    title: "Picture brief",
    action: "Create picture brief",
    status:
      "This creates a text brief, not an image. Image generation and photo editing are not connected. Reference files stay on your device and are not sent to an AI service.",
    fields: [
      field("title", "Picture name", undefined, true),
      {
        key: "style",
        label: "Style",
        type: "select",
        options: ["Cartoon + anime", "Realistic", "Portrait + social", "Mixed styles"],
      },
      field("idea", "Subject and scene", "textarea", true),
      field("mix", "Additional style to mix"),
      {
        key: "ratio",
        label: "Format",
        type: "select",
        options: ["Square 1:1", "Portrait 4:5", "Vertical 9:16", "Landscape 16:9"],
      },
      field("details", "Colors, lighting and must-have details", "textarea"),
      field("avoid", "Leave out", "textarea"),
    ],
  },
  video: {
    title: "Storyboard",
    action: "Create storyboard",
    status:
      "Storyboards work here; video rendering is not connected. Platform ad rules are not checked automatically. Check current official rules before publishing an ad.",
    fields: [
      field("title", "Video name", undefined, true),
      {
        key: "style",
        label: "Visual style",
        type: "select",
        options: [
          "Realistic",
          "Cartoon + anime",
          "AI animated",
          "Real person acting",
          "Mixed styles",
        ],
      },
      {
        key: "purpose",
        label: "Purpose",
        type: "select",
        options: ["Story", "Music video", "Commercial + ads", "Social clip"],
      },
      field("idea", "Story or offer", "textarea", true),
      { ...field("duration", "Length (seconds)", "number", true), min: 3, max: 600 },
      field("platform", "Target platform"),
      field("cta", "Closing line / call to action"),
    ],
  },
  brainstorm: {
    title: "Project notebook",
    action: "Organize notes",
    status:
      "Notes are organized using a fixed template, not an AI conversation. The downloadable local brain and crew conversations still need the Android implementation. Real Talk is kept separate from project drafts.",
    fields: [
      field("title", "Notebook name", undefined, true),
      {
        key: "kind",
        label: "Notebook type",
        type: "select",
        options: ["Project notes", "Talk it through", "Real Talk (private)"],
      },
      field("idea", "What's on your mind?", "textarea", true),
      field("goal", "Desired outcome"),
      field("obstacles", "Questions / obstacles", "textarea"),
      field("next", "Next steps, one per line", "textarea"),
    ],
  },
  marketing: {
    title: "Campaign planner",
    action: "Create campaign plan",
    status:
      "Campaign planning and the checklist work here. Nothing is posted, purchased or connected to a social account. Platform policy checks and automated tracking are not connected.",
    fields: [
      field("title", "Campaign name", undefined, true),
      field("offer", "Product / offer", undefined, true),
      field("audience", "Audience", undefined, true),
      {
        key: "platform",
        label: "Platform",
        type: "select",
        options: ["Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn", "Other"],
      },
      field("idea", "Post message", "textarea", true),
      field("cta", "Call to action", undefined, true),
      field("url", "Destination link"),
      field("date", "Target date", "date"),
    ],
  },
  teacher: {
    title: "Research journal",
    action: "Create research note",
    status:
      "You can record sources, findings and lessons. No background researcher is running, and facts are not automatically verified. The local teaching agent still needs the Android implementation.",
    fields: [
      field("title", "Research topic", undefined, true),
      field("question", "Question to investigate", "textarea", true),
      field("source", "Source link / citation"),
      field("idea", "Your findings", "textarea", true),
      field("lesson", "What changed / what you learned", "textarea"),
      field("safety", "Safety concerns / unanswered questions", "textarea"),
      field("next", "Next research step"),
    ],
  },
  money: {
    title: "Price calculator",
    action: "Calculate price",
    status:
      "Calculations use only the numbers you enter; they are estimates, not financial advice. Bank syncing, live competitor research and grant discovery are not connected.",
    fields: [
      field("title", "Project / product", undefined, true),
      { ...field("cost", "Total cost per item ($)", "number", true), min: 0 },
      { ...field("margin", "Target profit margin (%)", "number", true), min: 0, max: 99.99 },
      { ...field("quantity", "Number of items", "number", true), min: 1 },
      { ...field("competitor", "Competitor price ($), optional", "number"), min: 0 },
      { ...field("discount", "Undercut amount ($), optional", "number"), min: 0 },
      field("funding", "Grant / funding notes", "textarea"),
    ],
  },
};

export function isCoreMode(value: string): value is CoreModeId {
  return Object.hasOwn(WORKFLOWS, value);
}
export function initialValues(mode: CoreModeId): Values {
  return Object.fromEntries(WORKFLOWS[mode].fields.map((f) => [f.key, f.options?.[0] ?? ""]));
}
export type ValidationIssue =
  | { code: "required"; key: string; label: string }
  | { code: "range"; key: string; label: string; min: number; max: number | undefined }
  | { code: "whole"; key: string; label: string };

export function findValidationIssue(mode: CoreModeId, values: Values): ValidationIssue | undefined {
  for (const f of WORKFLOWS[mode].fields) {
    const value = values[f.key]?.trim() ?? "";
    if (f.required && !value) return { code: "required", key: f.key, label: f.label };
    if (f.type === "number" && value) {
      const n = Number(value);
      if (
        !Number.isFinite(n) ||
        (f.min !== undefined && n < f.min) ||
        (f.max !== undefined && n > f.max)
      ) {
        return { code: "range", key: f.key, label: f.label, min: f.min ?? 0, max: f.max };
      }
      if (f.key === "quantity" && !Number.isInteger(n))
        return { code: "whole", key: f.key, label: f.label };
    }
  }
  return undefined;
}

export function formatValidationIssue(
  mode: CoreModeId,
  issue: ValidationIssue,
  locale: Locale = "en",
): string {
  if (locale === "en") {
    if (issue.code === "required") return `Enter ${issue.label.toLowerCase()}.`;
    if (issue.code === "whole") return "Number of items must be a whole number.";
    return `Check ${issue.label.toLowerCase()}: ${issue.min} to ${issue.max ?? "a valid positive number"}.`;
  }
  const label = translate(locale, `field.${mode}.${issue.key}` as MessageKey);
  if (issue.code === "required") return translate(locale, "validation.required", { label });
  if (issue.code === "whole") return translate(locale, "validation.whole");
  return translate(locale, "validation.range", {
    label,
    min: issue.min,
    max: issue.max ?? translate(locale, "validation.positive"),
  });
}

export function validateValues(mode: CoreModeId, values: Values): string | undefined {
  const issue = findValidationIssue(mode, values);
  return issue ? formatValidationIssue(mode, issue, "en") : undefined;
}
export function calculatePrice(
  cost: number,
  margin: number,
  quantity: number,
  competitor?: number,
  discount = 0,
) {
  if (
    !Number.isFinite(cost) ||
    cost < 0 ||
    !Number.isFinite(margin) ||
    margin < 0 ||
    margin >= 100 ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    !Number.isFinite(discount) ||
    discount < 0 ||
    (competitor !== undefined && (!Number.isFinite(competitor) || competitor < 0))
  )
    throw new Error("Invalid price inputs");
  const minimum = Math.ceil((cost / (1 - margin / 100)) * 100) / 100;
  const target =
    competitor === undefined ? minimum : Math.round((competitor - discount) * 100) / 100;
  const price = Math.max(minimum, target);
  return {
    minimum,
    price,
    profit: price - cost,
    revenue: price * quantity,
    totalProfit: (price - cost) * quantity,
    canUndercut: competitor !== undefined && price < competitor,
  };
}
const line = (label: string, value?: string) => (value?.trim() ? `${label}: ${value.trim()}` : "");
export function createResult(mode: CoreModeId, v: Values, locale: Locale = "en"): string {
  const error = validateValues(mode, v);
  if (error) throw new Error(error);
  if (locale !== "en") return renderLocalizedResult(mode, v, locale);
  switch (mode) {
    case "music":
      return [
        v["title"],
        line("Genre", v["genre"]),
        line("Vibe", v["feeling"]),
        line("For", v["recipient"]),
        line("BPM", v["bpm"]),
        "",
        "INTRO — Set the mood",
        v["feeling"],
        "",
        "VERSE 1 — Introduce the story",
        v["idea"],
        "",
        "HOOK",
        v["hook"] || "[Write your repeated hook here]",
        "",
        "VERSE 2 — Develop the story",
        "[Add a new detail or turning point]",
        "",
        "BRIDGE / OUTRO",
        "[Resolve the message and return to the hook]",
      ]
        .filter((x) => x !== undefined)
        .join("\n");
    case "picture":
      return [
        v["title"],
        line("Style", v["style"]),
        line("Mix with", v["mix"]),
        line("Format", v["ratio"]),
        "",
        "SUBJECT & SCENE",
        v["idea"],
        "",
        line("Details", v["details"]),
        line("Exclude", v["avoid"]),
      ].join("\n");
    case "video": {
      const duration = Number(v["duration"]);
      const a = Math.round(duration / 3);
      const b = Math.round((duration * 2) / 3);
      return [
        v["title"],
        line("Style", v["style"]),
        line("Purpose", v["purpose"]),
        line("Platform", v["platform"]),
        "",
        `SCENE 1 · 0–${a}s · Opening`,
        "[Choose an opening shot]",
        `SCENE 2 · ${a}–${b}s · Main story`,
        v["idea"],
        `SCENE 3 · ${b}–${duration}s · Close`,
        v["cta"] || "[Choose your closing line]",
        "",
        "Before release: review footage, music rights, consent and current platform rules.",
      ].join("\n");
    }
    case "brainstorm":
      return v["kind"] === "Real Talk (private)"
        ? [
            v["title"],
            "REAL TALK — Separate private note",
            "",
            v["idea"],
            "",
            line("What I need", v["goal"]),
          ].join("\n")
        : [
            v["title"],
            "",
            "IDEA",
            v["idea"],
            "",
            line("Outcome", v["goal"]),
            "",
            "OPEN QUESTIONS",
            v["obstacles"] || "[Add open questions]",
            "",
            "NEXT STEPS",
            v["next"] || "[Add a next step]",
          ].join("\n");
    case "marketing":
      return [
        v["title"],
        line("Offer", v["offer"]),
        line("Audience", v["audience"]),
        line("Platform", v["platform"]),
        line("Target date", v["date"]),
        "",
        "PROFILE FUNNEL",
        `Bio: ${v["offer"]} for ${v["audience"]}`,
        line("Destination", v["url"]),
        "",
        "POST DRAFT",
        v["idea"],
        v["cta"],
        v["url"] || "",
        "",
        "RELEASE CHECKLIST",
        "Confirm destination link",
        "Review platform rules and permissions",
        "Publish manually",
        "Record results",
      ].join("\n");
    case "teacher":
      return [
        v["title"],
        "",
        "RESEARCH QUESTION",
        v["question"],
        "",
        line("Source", v["source"]),
        v["source"]
          ? "Verification: not independently checked"
          : "Verification: no source recorded",
        "",
        "FINDINGS",
        v["idea"],
        "",
        line("Lesson", v["lesson"]),
        line("Safety / unknowns", v["safety"]),
        line("Next step", v["next"]),
      ].join("\n");
    case "money": {
      const r = calculatePrice(
        Number(v["cost"]),
        Number(v["margin"]),
        Number(v["quantity"]),
        v["competitor"] ? Number(v["competitor"]) : undefined,
        Number(v["discount"] || 0),
      );
      const usd = (n: number) => `$${n.toFixed(2)}`;
      return [
        v["title"],
        "",
        `Minimum price for ${v["margin"]}% margin: ${usd(r.minimum)}`,
        `Suggested price per item: ${usd(r.price)}`,
        `Profit per item: ${usd(r.profit)}`,
        `Revenue for ${v["quantity"]} items: ${usd(r.revenue)}`,
        `Estimated total profit: ${usd(r.totalProfit)}`,
        "",
        v["competitor"]
          ? r.canUndercut
            ? "Below competitor while preserving your target margin."
            : "Cannot undercut this competitor while preserving your target margin."
          : "No competitor comparison entered.",
        "Formula: price = cost ÷ (1 − target margin / 100). Rounded up to the nearest cent.",
        "",
        line("Funding notes", v["funding"]),
      ].join("\n");
    }
  }
}
