import { describe, expect, it } from "vitest";
import { CREW, KIDS, MODES } from "@/lib/dreamforge";
import {
  catalogFor,
  en,
  OPTION_KEYS,
  TASK_IDS,
  TASK_KEYS,
  type MessageKey,
} from "@/lib/i18n/catalog";
import {
  LOCALES,
  localesFromAcceptLanguage,
  matchLocale,
  resolveLocale,
  type Locale,
} from "@/lib/i18n/locale";
import {
  createResult,
  initialValues,
  validateValues,
  WORKFLOWS,
  isCoreMode,
} from "@/lib/workflows";

const placeholders = (text: string) => text.match(/\{(\w+)\}/g)?.sort() ?? [];

describe("locale detection", () => {
  it("maps regional tags and falls back when a tag is unknown", () => {
    expect(matchLocale("pt-PT")).toBe("pt-BR");
    expect(matchLocale("pt_BR")).toBe("pt-BR");
    expect(matchLocale("pt")).toBe("pt-BR");
    expect(matchLocale("es-ES")).toBe("es");
    expect(matchLocale("es-419")).toBe("es");
    expect(matchLocale("es-MX")).toBe("es");
    expect(matchLocale("fr-CA")).toBe("fr");
    expect(matchLocale("de-AT")).toBe("de");
    expect(matchLocale("en-GB")).toBe("en");
    expect(matchLocale("en-US")).toBe("en");
    expect(matchLocale("hi-IN")).toBe("hi");
    expect(matchLocale("ja-JP")).toBe("ja");
    expect(matchLocale("jp")).toBe("ja");
    expect(matchLocale("ko-KR")).toBe("ko");
    expect(matchLocale("id-ID")).toBe("id");
    expect(matchLocale("in-ID")).toBe("id");
    expect(matchLocale("it-IT")).toBe("it");
    expect(matchLocale("zh-CN")).toBeUndefined();
    expect(matchLocale("nl-NL")).toBeUndefined();
    expect(matchLocale("")).toBeUndefined();
  });

  it("prefers a saved choice, then the device list, then English", () => {
    expect(resolveLocale({ stored: "ja", device: ["es-MX", "en-US"] })).toBe("ja");
    expect(resolveLocale({ stored: "nope", device: ["pt-PT", "en"] })).toBe("pt-BR");
    expect(resolveLocale({ stored: null, device: ["zh-CN", "fr-FR"] })).toBe("fr");
    expect(resolveLocale({ stored: null, device: ["zh-CN"] })).toBe("en");
    expect(resolveLocale({ stored: "", device: [] })).toBe("en");
    expect(resolveLocale({ stored: "es-419", device: ["en-US"] })).toBe("en");
  });

  it("orders Accept-Language by quality", () => {
    expect(localesFromAcceptLanguage("fr;q=0.2, ja;q=0.9, en;q=0.5")).toEqual(["ja", "en", "fr"]);
  });
});

describe("translation catalogs", () => {
  it("covers every English string, keeps placeholders, and leaves product names intact", () => {
    const keys = Object.keys(en) as MessageKey[];
    for (const locale of LOCALES) {
      const catalog = catalogFor(locale);
      for (const key of keys) {
        expect(catalog[key], `${locale} ${key}`).toEqual(expect.any(String));
        expect(catalog[key].trim().length, `${locale} ${key}`).toBeGreaterThan(0);
        expect(placeholders(catalog[key]), `${locale} ${key}`).toEqual(placeholders(en[key]));
      }
      expect(catalog["about.short"]).toContain("DreamForge");
      expect(catalog["about.short"]).toContain("Dream");
      if (locale !== "en") expect(catalog["about.age"]).not.toBe(en["about.age"]);
    }
  });

  it("keeps the English UI copy aligned with the existing workshop text", () => {
    for (const mode of [...MODES, KIDS]) {
      expect(en[`mode.${mode.id}.title` as MessageKey]).toBe(mode.title);
      expect(en[`mode.${mode.id}.tag` as MessageKey]).toBe(mode.tag);
    }
    for (const mode of Object.keys(WORKFLOWS)) {
      if (!isCoreMode(mode)) continue;
      const workflow = WORKFLOWS[mode];
      expect(en[`workflow.${mode}.title` as MessageKey]).toBe(workflow.title);
      expect(en[`workflow.${mode}.action` as MessageKey]).toBe(workflow.action);
      expect(en[`workflow.${mode}.status` as MessageKey]).toBe(workflow.status);
      for (const field of workflow.fields) {
        expect(en[`field.${mode}.${field.key}` as MessageKey]).toBe(field.label);
        for (const option of field.options ?? []) {
          expect(OPTION_KEYS[option as keyof typeof OPTION_KEYS], option).toBeTruthy();
        }
      }
    }
    for (const [value, key] of Object.entries(OPTION_KEYS)) expect(en[key]).toBe(value);
    for (const task of TASK_IDS) expect(en[TASK_KEYS[task]]).toBe(task);
    for (const member of CREW) {
      expect(en[`crew.${member.id}.role` as MessageKey]).toBe(member.role);
      if (member.awaiting)
        expect(en[`crew.${member.id}.awaiting` as MessageKey]).toBe(member.awaiting);
    }
  });
});

describe("localized drafts", () => {
  const music = () => {
    const values = initialValues("music");
    for (const field of WORKFLOWS.music.fields) if (field.required) values[field.key] = "My launch";
    return values;
  };

  it("leaves the English draft and validation wording unchanged", () => {
    const values = music();
    expect(createResult("music", values, "en")).toBe(createResult("music", values));
    expect(createResult("music", values)).toContain("INTRO — Set the mood");
    expect(createResult("music", values)).toContain("Genre: Hip-hop");
    expect(validateValues("music", initialValues("music"))).toBe("Enter song name.");
  });

  it("translates the draft around the words the user typed", () => {
    const values = music();
    const japanese = createResult("music", values, "ja");
    expect(japanese).toContain("My launch");
    expect(japanese).toContain(catalogFor("ja")["result.intro"]);
    expect(japanese).not.toContain("INTRO — Set the mood");
    const spanish = createResult(
      "brainstorm",
      {
        title: "Private",
        kind: "Real Talk (private)",
        idea: "Personal thought",
        next: "Invoice customer",
      },
      "es",
    );
    expect(spanish).toContain("Personal thought");
    expect(spanish).not.toContain("Invoice customer");
    expect(spanish).toContain(catalogFor("es")["result.realTalk"]);
  });

  it("types the supported locales", () => {
    const sample: Locale = "pt-BR";
    expect(LOCALES).toContain(sample);
  });
});
