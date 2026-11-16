import { translate } from "./i18n/catalog";
import { localesFromAcceptLanguage, resolveLocale } from "./i18n/locale";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderErrorPage(acceptLanguage?: string | null): string {
  const locale = resolveLocale({
    stored: null,
    device: localesFromAcceptLanguage(acceptLanguage),
  });
  const title = escapeHtml(translate(locale, "error.pageFailed"));
  const body = escapeHtml(translate(locale, "error.pageFailedBody"));
  const retry = escapeHtml(translate(locale, "error.tryAgain"));
  const home = escapeHtml(translate(locale, "error.goHome"));
  return `<!doctype html>
<html lang="${escapeHtml(locale)}">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, "Noto Sans Devanagari", "Noto Sans JP", "Noto Sans KR", sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; overflow-wrap: break-word; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      <p>${body}</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">${retry}</button>
        <a class="secondary" href="/">${home}</a>
      </div>
    </div>
  </body>
</html>`;
}
