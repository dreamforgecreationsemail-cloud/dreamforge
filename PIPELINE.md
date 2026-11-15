# DreamForge media pipeline

This document describes what the media pipeline in this repository actually does, and what is still missing.

## What this app is today

The workshop UI is built around seven core modes (Music, Picture, Video, Brainstormer, Marketing, Teacher, Money) plus a Kids Factory teaser for a later, separate build. Most workflows are **text drafts and planners** that live in session state. You can download and restore drafts as JSON. They are not automatically saved to the cloud or to browser storage.

Workflow status strings in the UI are honest about this: audio, image, and video generation are not connected in this website build.

The one AI path that is wired, when you configure a key, is Brainstormer → "Talk it through", which sends the organized notes to DeepSeek so the crew council can return a finished plan.

## Pipeline files

These modules were added after the original Lovable export so PC/phone detection, local saves, and a phone-to-PC bridge could exist without overwriting `src/lib/dreamforge.ts` (the MODES / CREW / SKIT data).

- `src/config/environment.ts` — runtime PC vs phone detection, plus generator/bridge URL selection
- `src/lib/engine-modes.ts` — `ENGINE_MODES` / `ACTIVE_DEPLOYMENT_MODE` (Founders Edition: unrestricted developer sandbox)
- `src/lib/pipeline.ts` — save helpers (PC: File System Access API or download; phone: IndexedDB bucket)
- `.env.example` — build-time fallbacks and server-side key names (copy to `.env` and fill in)
- `bridge.py` — PC server on `0.0.0.0:8898`, Python standard library only

## The bridge

```bash
python bridge.py
```

On startup it prints your PC's LAN IP. Set that in `.env`:

```
VITE_GENERATOR_LAN_URL=http://<that-ip>:8898
```

Then rebuild or restart `bun run dev` so Vite can inline the value.

Endpoints:

- `GET /health` — `{"ok": true, "is_pc": true, "port": 8898}`
- `POST /save` — writes a base64 file to `Pictures/Dreamforge_Sandbox_Outputs/` on the PC
- `POST /generate/image` and `POST /generate/video` — return **501** until a generator is wired in

## What is still missing

The open question is what actually generates images or video (a local model server, an API, or something else). Once that exists, point `GENERATOR_URL` at it or replace the `/generate/*` handlers in `bridge.py`. Until then the pipeline fails clearly; it does not pretend an asset was created.

A text model such as Ollama `qwen2.5` is not an image or video generator, and does not satisfy `/generate/image` or `/generate/video`.

## Reaching the PC from a phone

Home Wi-Fi: use the LAN IP `bridge.py` prints, not `127.0.0.1`. On a phone, localhost means the phone itself.

If you use a VPN such as WireGuard instead of LAN Wi-Fi:

- `bridge.py` already listens on `0.0.0.0:8898`, so it is reachable on any interface, including the VPN interface.
- Set `VITE_GENERATOR_LAN_URL=http://<PC VPN IP>:8898`.
- Test from the phone browser: `http://<PC VPN IP>:8898/health`.
- If that fails: the bridge must be running, the PC firewall must allow port 8898 / `python.exe`, and each peer's allowed IPs must include the other peer (for example `10.0.0.2/32`).

## How to run the app

This is a Bun project (`bun.lock`). Use Bun, not npm — `npm install` fails here with `Cannot read properties of null (reading 'edgesOut')`.

```bash
bun install
cp .env.example .env
bun run dev
```

Or a production-style local run (Nitro is pinned to the `node-server` preset in `vite.config.ts`):

```bash
bun run build
bun run start
```

The Node server listens on http://localhost:3000/ by default.

Note: inside a Lovable cloud/sandbox build, Lovable may still force the Cloudflare preset. The Node switch applies to local builds.
