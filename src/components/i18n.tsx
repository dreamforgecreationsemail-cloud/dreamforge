import { useEffect, useLayoutEffect } from "react";
import { useI18n } from "./use-i18n";

const useIsoLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;

/** Keeps <html lang> aligned with the active locale for line breaking and fonts. */
export function LocaleEffects() {
  const { locale } = useI18n();
  useIsoLayoutEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
