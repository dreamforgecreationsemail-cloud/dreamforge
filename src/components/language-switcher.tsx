import { LOCALES, LOCALE_NAMES, isLocale } from "@/lib/i18n/locale";
import { useI18n } from "./use-i18n";

export function LanguageSwitcher({
  labelId,
  showHelp = false,
}: {
  labelId?: string;
  showHelp?: boolean;
}) {
  const { locale, setLocale, t } = useI18n();
  const inputId = labelId ? `${labelId}-select` : "dreamforge-language";
  return (
    <div className="space-y-1.5">
      {!labelId && (
        <label htmlFor={inputId} className="text-base font-bold">
          {t("settings.language")}
        </label>
      )}
      <select
        id={inputId}
        className="language-select h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground"
        aria-labelledby={labelId}
        value={locale}
        onChange={(event) => {
          const next = event.target.value;
          if (isLocale(next)) setLocale(next);
        }}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
      {showHelp && (
        <p className="text-sm leading-snug text-muted-foreground">{t("settings.help")}</p>
      )}
    </div>
  );
}
