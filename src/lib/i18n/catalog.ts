import type { Locale } from "./locale";
import { en, type Catalog, type MessageKey } from "./messages/en";
import { es } from "./messages/es";
import { ptBR } from "./messages/pt-BR";
import { fr } from "./messages/fr";
import { de } from "./messages/de";
import { hi } from "./messages/hi";
import { ja } from "./messages/ja";
import { ko } from "./messages/ko";
import { id } from "./messages/id";
import { it } from "./messages/it";

export type { Catalog, MessageKey };
export { en };

const catalogs: Record<Locale, Catalog> = {
  en,
  es,
  "pt-BR": ptBR,
  fr,
  de,
  hi,
  ja,
  ko,
  id,
  it,
};

export function catalogFor(locale: Locale): Catalog {
  return catalogs[locale] ?? en;
}

export function translate(
  locale: Locale,
  key: MessageKey,
  vars: Record<string, string | number> = {},
): string {
  const template = catalogFor(locale)[key] ?? en[key];
  return template.replace(/\{(\w+)\}/g, (token, name: string) => {
    const value = vars[name];
    return value === undefined ? token : String(value);
  });
}

/** Dynamic keys such as mode.music.title. Unknown keys are returned as-is. */
export function translateKey(locale: Locale, key: string): string {
  if (Object.prototype.hasOwnProperty.call(en, key)) return translate(locale, key as MessageKey);
  return key;
}

export function pluralCategory(locale: Locale, count: number): "one" | "other" {
  if (locale === "id" || locale === "ja" || locale === "ko") return "other";
  if (locale === "fr") return count === 0 || count === 1 ? "one" : "other";
  return count === 1 ? "one" : "other";
}

export function translatePlural(
  locale: Locale,
  one: MessageKey,
  other: MessageKey,
  count: number,
  vars: Record<string, string | number> = {},
): string {
  const key = pluralCategory(locale, count) === "one" ? one : other;
  return translate(locale, key, { ...vars, count });
}

export const OPTION_KEYS = {
  "Hip-hop": "option.hipHop",
  "R&B": "option.rnb",
  Pop: "option.pop",
  Rock: "option.rock",
  Country: "option.country",
  Electronic: "option.electronic",
  Other: "option.other",
  "Cartoon + anime": "option.cartoonAnime",
  Realistic: "option.realistic",
  "Portrait + social": "option.portraitSocial",
  "Mixed styles": "option.mixed",
  "Square 1:1": "option.square",
  "Portrait 4:5": "option.portrait45",
  "Vertical 9:16": "option.vertical",
  "Landscape 16:9": "option.landscape",
  "AI animated": "option.aiAnimated",
  "Real person acting": "option.realPerson",
  Story: "option.story",
  "Music video": "option.musicVideo",
  "Commercial + ads": "option.commercial",
  "Social clip": "option.socialClip",
  "Project notes": "option.projectNotes",
  "Talk it through": "option.talkThrough",
  "Real Talk (private)": "option.realTalk",
  Instagram: "option.instagram",
  Facebook: "option.facebook",
  TikTok: "option.tiktok",
  YouTube: "option.youtube",
  LinkedIn: "option.linkedin",
} as const satisfies Record<string, MessageKey>;

export function optionLabel(locale: Locale, value: string): string {
  if (!Object.prototype.hasOwnProperty.call(OPTION_KEYS, value)) return value;
  const key = OPTION_KEYS[value as keyof typeof OPTION_KEYS];
  return translate(locale, key);
}

export const TASK_IDS = [
  "Confirm destination link",
  "Review platform rules and permissions",
  "Publish manually",
  "Record results",
] as const;

export type TaskId = (typeof TASK_IDS)[number];

export const TASK_KEYS = {
  "Confirm destination link": "task.confirm",
  "Review platform rules and permissions": "task.review",
  "Publish manually": "task.publish",
  "Record results": "task.record",
} as const satisfies Record<TaskId, MessageKey>;

const KNOWN_ERRORS = {
  "DeepSeek is not configured.": "error.deepseekMissing",
  "Your DeepSeek balance is empty.": "error.deepseekBalance",
  "DeepSeek rejected the configured key.": "error.deepseekKey",
  "Could not finish this request. Please try again.": "error.requestFailed",
} as const satisfies Record<string, MessageKey>;

export function translateKnownError(locale: Locale, message: string): string {
  if (!Object.prototype.hasOwnProperty.call(KNOWN_ERRORS, message)) return message;
  return translate(locale, KNOWN_ERRORS[message as keyof typeof KNOWN_ERRORS]);
}
