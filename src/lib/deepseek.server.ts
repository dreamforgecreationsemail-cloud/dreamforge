import * as tls from "node:tls";

// The desktop Node runtime needs the same trusted roots as the Windows browser.
if (process.platform === "win32" && typeof tls.setDefaultCACertificates === "function") {
  tls.setDefaultCACertificates([...tls.getCACertificates("default"), ...tls.getCACertificates("system")]);
}

export async function councilConnection() {
  const gateway = process.env.LOVABLE_API_KEY;
  const connector = process.env.UDC_DEEPSEEK_API_KEY;
  if (gateway && connector) return {
    url: "https://connector-gateway.lovable.dev/udc_deepseek/chat/completions",
    headers: new Headers({ Authorization: `Bearer ${gateway}`, "X-Connection-Api-Key": connector }),
  };
  const key = process.env.DEEPSEEK_API_KEY;
  return key ? {
    url: "https://api.deepseek.com/chat/completions",
    headers: new Headers({ Authorization: `Bearer ${key}` }),
  } : null;
}
