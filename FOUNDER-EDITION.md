# DreamForge App Studio — Founders Edition

This public repository is the **Founders Edition** beta: an unrestricted developer sandbox. There are no consumer tiers, pay-to-unlock gates, or daily limits in this copy.

- Product: DreamForge App Studio
- Edition: Founders Edition beta
- Source baseline: the Neon Atelier Founders Edition build (November 2026)

## What makes this the Founders Edition

- `ACTIVE_DEPLOYMENT_MODE` is `unrestricted-developer-sandbox` in `src/lib/engine-modes.ts`.
- Consumer restrictions do not belong in this project. A consumer copy, if published later, would be separate.
- `src/lib/dreamforge.ts` holds the workshop MODES / CREW / SKIT data.

## Run it

```bash
bun install
cp .env.example .env
# fill in any keys you have, then:
bun run dev
# or a production-style local run:
bun run build
bun run start
```

Default URL: http://localhost:3000/

Use Bun, not npm. `npm install` fails on this project with an `edgesOut` error.

Also run the PC bridge when you want phone-to-PC saving:

```bash
python bridge.py
```

The bridge listens on 0.0.0.0:8898. `GET /health` should return `{"ok": true, "is_pc": true, "port": 8898}`.

## Still open

- `POST /generate/image` and `POST /generate/video` on `bridge.py` return 501 until a generator is chosen and wired in (or `GENERATOR_URL` is set).
- Most mode workflows are text drafts and planners. Image, audio, and video generation are not connected in this website build. See `PIPELINE.md`.
