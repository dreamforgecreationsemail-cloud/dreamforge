import { useEffect, useSyncExternalStore } from "react";
import { translate, translateKey, translatePlural, type MessageKey } from "@/lib/i18n/catalog";
import {
  deviceLocales,
  isLocale,
  LOCALE_STORAGE_KEY,
  readStoredLocale,
  resolveLocale,
  writeStoredLocale,
  type Locale,
} from "@/lib/i18n/locale";

const CHANGE = "dreamforge-locale";

// Language preference only. Drafts stay in session memory and are not written here.
let cached: Locale | null = null;

function currentLocale(): Locale {
  if (cached === null) {
    cached = resolveLocale({ stored: readStoredLocale(), device: deviceLocales() });
  }
  return cached;
}

function serverLocale(): Locale {
  return "en";
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== LOCALE_STORAGE_KEY) return;
    cached = resolveLocale({ stored: event.newValue, device: deviceLocales() });
    onChange();
  };
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function publish(next: Locale) {
  cached = next;
  if (typeof document !== "undefined") document.documentElement.lang = next;
  writeStoredLocale(next);
  window.dispatchEvent(new Event(CHANGE));
}

export function useI18n() {
  const locale = useSyncExternalStore(subscribe, currentLocale, serverLocale);
  return {
    locale,
    setLocale(next: Locale) {
      if (!isLocale(next) || next === currentLocale()) return;
      publish(next);
    },
    t(key: MessageKey, vars: Record<string, string | number> = {}) {
      return translate(locale, key, vars);
    },
    text(key: string) {
      return translateKey(locale, key);
    },
    tn(
      one: MessageKey,
      other: MessageKey,
      count: number,
      vars: Record<string, string | number> = {},
    ) {
      return translatePlural(locale, one, other, count, vars);
    },
  };
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
