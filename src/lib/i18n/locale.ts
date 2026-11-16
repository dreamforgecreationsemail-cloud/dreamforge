/** Supported UI languages. Spanish copy is Latin American (es-419). */
export const LOCALES = ["en", "es", "pt-BR", "fr", "de", "hi", "ja", "ko", "id", "it"] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_STORAGE_KEY = "dreamforge.locale";

/** Endonyms, so the switcher is recognizable before the UI language changes. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español (Latinoamérica)",
  "pt-BR": "Português (Brasil)",
  fr: "Français",
  de: "Deutsch",
  hi: "हिन्दी",
  ja: "日本語",
  ko: "한국어",
  id: "Bahasa Indonesia",
  it: "Italiano",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/**
 * Map a BCP 47 tag to a supported locale.
 * pt-PT and bare pt fall through to Brazilian Portuguese.
 * Every es-* tag, including es-ES, uses Latin American Spanish.
 * Unknown tags return undefined so the caller can try the next preference.
 */
export function matchLocale(tag: string | null | undefined): Locale | undefined {
  if (!tag) return undefined;
  const norm = tag.trim().replace(/_/g, "-").toLowerCase();
  if (!norm) return undefined;

  if (norm === "pt" || norm.startsWith("pt-")) return "pt-BR";
  if (norm === "es" || norm.startsWith("es-")) return "es";
  // Legacy Android / Java codes.
  if (norm === "in" || norm.startsWith("in-")) return "id";
  if (norm === "jp" || norm.startsWith("jp-")) return "ja";

  const exact = LOCALES.find((locale) => locale.toLowerCase() === norm);
  if (exact) return exact;

  const primary = norm.split("-")[0];
  if (!primary) return undefined;
  return LOCALES.find((locale) => locale.toLowerCase().split("-")[0] === primary);
}

/** Saved choice wins. Otherwise the first device tag that we support. Otherwise English. */
export function resolveLocale(input: {
  stored: string | null | undefined;
  device: readonly string[];
}): Locale {
  if (isLocale(input.stored)) return input.stored;
  for (const tag of input.device) {
    const match = matchLocale(tag);
    if (match) return match;
  }
  return "en";
}

export function localesFromAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      let quality = 1;
      for (const param of params) {
        const [name, value] = param.trim().split("=");
        if (name?.trim() === "q") {
          const parsed = Number(value);
          if (Number.isFinite(parsed)) quality = parsed;
        }
      }
      return { tag: tag?.trim() ?? "", quality };
    })
    .filter((item) => item.tag.length > 0)
    .sort((a, b) => b.quality - a.quality)
    .map((item) => item.tag);
}

export function deviceLocales(): string[] {
  if (typeof navigator === "undefined") return [];
  const list = navigator.languages;
  if (list && list.length > 0) return [...list];
  return navigator.language ? [navigator.language] : [];
}

export function readStoredLocale(): string | null {
  try {
    return globalThis.localStorage?.getItem(LOCALE_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function writeStoredLocale(locale: Locale): void {
  try {
    globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Private mode or blocked storage: the choice still applies for this session.
  }
}
