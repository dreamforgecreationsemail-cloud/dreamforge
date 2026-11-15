// src/config/environment.ts
// Runtime environment detection for DreamForge Neon Atelier.
//
// Vite inlines import.meta.env values at BUILD time, so an env file
// alone cannot tell you at runtime whether this bundle is running
// on a PC or on a phone. Env values below are fallbacks
// only. Runtime detection decides.
//
// Order:
//   1. ?pc=1 / ?pc=0 URL override (testing)
//   2. localStorage 'force-pc' = '1' / '0' (testing)
//   3. User-Agent: mobile (Android / iOS / SM-S92) -> phone
//   4. User-Agent: desktop (Windows / macOS / Linux) -> PC, even
//      if .env.production says otherwise
//   5. VITE_DEFAULT_IS_PC env fallback, last resort only
//
// NOTE: this file was added after the original Lovable export so the
// media pipeline could detect PC vs phone at runtime and pick a
// reachable generator/bridge URL. See PIPELINE.md.

export function getIsExecutingOnPC(): boolean {
  if (typeof window !== "undefined" && window.location) {
    const pcParam = new URLSearchParams(window.location.search).get("pc");
    if (pcParam === "1") return true;
    if (pcParam === "0") return false;
  }

  if (typeof localStorage !== "undefined") {
    const forced = localStorage.getItem("force-pc");
    if (forced === "1") return true;
    if (forced === "0") return false;
  }

  if (typeof navigator !== "undefined" && navigator.userAgent) {
    const ua = navigator.userAgent.toLowerCase();
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|sm-s92/i.test(ua)) {
      return false;
    }
    if (/windows nt|macintosh|linux x86_64|linux aarch64/.test(ua)) {
      return true;
    }
  }

  return import.meta.env["VITE_DEFAULT_IS_PC"] === "true";
}

export function getGeneratorApiUrl(): string {
  const url =
    import.meta.env["VITE_GENERATOR_API_URL"] || "http://127.0.0.1:8898";

  // 127.0.0.1 / localhost on a phone means the phone itself, not the PC.
  // A phone on the same Wi-Fi needs the PC's LAN IP.
  if (
    !getIsExecutingOnPC() &&
    /^(https?:\/\/)(127\.0\.0\.1|localhost)(:\d+)?/i.test(url)
  ) {
    const lan = import.meta.env["VITE_GENERATOR_LAN_URL"];
    if (lan) return lan;
    console.warn(
      "[DreamForge] Generator URL is 127.0.0.1/localhost, unreachable from phone. " +
        "Set VITE_GENERATOR_LAN_URL to your PC LAN IP, e.g. http://192.168.1.10:8898, " +
        "and run bridge.py on the PC."
    );
  }
  return url;
}
