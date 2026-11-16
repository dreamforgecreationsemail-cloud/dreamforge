import { translate, optionLabel, type MessageKey } from "./i18n/catalog";
import type { Locale } from "./i18n/locale";
import { calculatePrice, type CoreModeId, type Values } from "./workflows";

function raw(value: string | undefined): string {
  return value ?? "";
}

function line(label: string, value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed ? `${label}: ${trimmed}` : "";
}

/** Same document shape as the English createResult path, in the active language. */
export function renderLocalizedResult(mode: CoreModeId, v: Values, locale: Locale): string {
  const t = (key: MessageKey, vars: Record<string, string | number> = {}) =>
    translate(locale, key, vars);
  const opt = (value: string | undefined) => optionLabel(locale, raw(value));

  switch (mode) {
    case "music":
      return [
        raw(v["title"]),
        line(t("result.genre"), opt(v["genre"])),
        line(t("result.vibe"), raw(v["feeling"])),
        line(t("result.for"), raw(v["recipient"])),
        line(t("result.bpm"), raw(v["bpm"])),
        "",
        t("result.intro"),
        raw(v["feeling"]),
        "",
        t("result.verse1"),
        raw(v["idea"]),
        "",
        t("result.hook"),
        raw(v["hook"]) || t("result.hookPlaceholder"),
        "",
        t("result.verse2"),
        t("result.verse2Placeholder"),
        "",
        t("result.bridge"),
        t("result.bridgePlaceholder"),
      ].join("\n");
    case "picture":
      return [
        raw(v["title"]),
        line(t("result.style"), opt(v["style"])),
        line(t("result.mixWith"), raw(v["mix"])),
        line(t("result.format"), opt(v["ratio"])),
        "",
        t("result.subject"),
        raw(v["idea"]),
        "",
        line(t("result.details"), raw(v["details"])),
        line(t("result.exclude"), raw(v["avoid"])),
      ].join("\n");
    case "video": {
      const duration = Number(v["duration"]);
      const a = Math.round(duration / 3);
      const b = Math.round((duration * 2) / 3);
      return [
        raw(v["title"]),
        line(t("result.style"), opt(v["style"])),
        line(t("result.purpose"), opt(v["purpose"])),
        line(t("result.platform"), raw(v["platform"])),
        "",
        t("result.scene1", { a }),
        t("result.openingShot"),
        t("result.scene2", { a, b }),
        raw(v["idea"]),
        t("result.scene3", { b, duration }),
        raw(v["cta"]) || t("result.closingLine"),
        "",
        t("result.beforeRelease"),
      ].join("\n");
    }
    case "brainstorm":
      return v["kind"] === "Real Talk (private)"
        ? [
            raw(v["title"]),
            t("result.realTalk"),
            "",
            raw(v["idea"]),
            "",
            line(t("result.whatINeed"), raw(v["goal"])),
          ].join("\n")
        : [
            raw(v["title"]),
            "",
            t("result.idea"),
            raw(v["idea"]),
            "",
            line(t("result.outcome"), raw(v["goal"])),
            "",
            t("result.openQuestions"),
            raw(v["obstacles"]) || t("result.openQuestionsPlaceholder"),
            "",
            t("result.nextSteps"),
            raw(v["next"]) || t("result.nextStepPlaceholder"),
          ].join("\n");
    case "marketing":
      return [
        raw(v["title"]),
        line(t("result.offer"), raw(v["offer"])),
        line(t("result.audience"), raw(v["audience"])),
        line(t("result.platform"), opt(v["platform"])),
        line(t("result.targetDate"), raw(v["date"])),
        "",
        t("result.profileFunnel"),
        t("result.bio", { offer: raw(v["offer"]), audience: raw(v["audience"]) }),
        line(t("result.destination"), raw(v["url"])),
        "",
        t("result.postDraft"),
        raw(v["idea"]),
        raw(v["cta"]),
        raw(v["url"]) || "",
        "",
        t("result.releaseChecklist"),
        t("task.confirm"),
        t("task.review"),
        t("task.publish"),
        t("task.record"),
      ].join("\n");
    case "teacher":
      return [
        raw(v["title"]),
        "",
        t("result.researchQuestion"),
        raw(v["question"]),
        "",
        line(t("result.source"), raw(v["source"])),
        raw(v["source"]) ? t("result.verificationUnchecked") : t("result.verificationNone"),
        "",
        t("result.findings"),
        raw(v["idea"]),
        "",
        line(t("result.lesson"), raw(v["lesson"])),
        line(t("result.safetyUnknowns"), raw(v["safety"])),
        line(t("result.nextStep"), raw(v["next"])),
      ].join("\n");
    case "money": {
      const competitor = v["competitor"] ? Number(v["competitor"]) : undefined;
      const priced = calculatePrice(
        Number(v["cost"]),
        Number(v["margin"]),
        Number(v["quantity"]),
        competitor,
        Number(v["discount"] || 0),
      );
      const usd = (amount: number) => `$${amount.toFixed(2)}`;
      return [
        raw(v["title"]),
        "",
        t("result.minPrice", { margin: raw(v["margin"]), price: usd(priced.minimum) }),
        t("result.suggested", { price: usd(priced.price) }),
        t("result.profitEach", { price: usd(priced.profit) }),
        t("result.revenue", { quantity: raw(v["quantity"]), price: usd(priced.revenue) }),
        t("result.totalProfit", { price: usd(priced.totalProfit) }),
        "",
        v["competitor"]
          ? priced.canUndercut
            ? t("result.belowCompetitor")
            : t("result.cannotUndercut")
          : t("result.noCompetitor"),
        t("result.formula"),
        "",
        line(t("result.fundingNotes"), raw(v["funding"])),
      ].join("\n");
    }
  }
}
