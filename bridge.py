#!/usr/bin/env python3
"""
DreamForge bridge.py — PC server for the phone-to-PC media pipeline.

Default choice (no decision needed from you):
  - Home Wi-Fi, not the internet. Phone and PC on the same Wi-Fi.
  - Plain HTTP POST, not WebSocket. Simpler, and fine unless you
    need live progress streaming while an image/video generates.
  - Listens on 0.0.0.0:8898, so the phone can reach it by LAN IP.

Run on your PC:
  python bridge.py

On startup it prints your PC's LAN IP. Copy that into:
  VITE_GENERATOR_LAN_URL=http://<that-ip>:8898

Endpoints:
  GET  /health
    -> {"ok": true, "is_pc": true}

  POST /save
    {"fileName": "forge_123.jpg", "base64Data": "...", "type": "image"}
    -> writes to Pictures/Dreamforge_Sandbox_Outputs/<fileName>
    -> {"ok": true, "savedPath": "..."}

  POST /generate/image
  POST /generate/video
    {"prompt": "...", "timestamp": 123}
    -> PLACEHOLDER. This bridge does not generate images itself.
       Point GENERATOR_URL below at whatever actually generates
       (local model server, Ollama, etc.), or replace this handler
       with your generator call. Until then it returns 501 with
       a clear message, instead of pretending it worked.

No extra packages needed — Python standard library only.
"""

import base64
import json
import os
import socket
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PORT = 8898
# Where PC saves land. Change this if you want a different folder.
SAVE_DIR = Path.home() / "Pictures" / "Dreamforge_Sandbox_Outputs"
# Optional: a real generator to forward /generate/* to.
# Leave empty until you have one, e.g. "http://127.0.0.1:11434"
GENERATOR_URL = os.environ.get("GENERATOR_URL", "")


def get_lan_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


class Handler(BaseHTTPRequestHandler):
    def _send(self, status: int, payload: dict):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        # CORS: allow the phone app / browser to call this server.
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(204, {})

    def do_GET(self):
        if self.path == "/health":
            self._send(200, {"ok": True, "is_pc": True, "port": PORT})
        else:
            self._send(404, {"ok": False, "error": "not found"})

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if not length:
            return {}
        return json.loads(self.rfile.read(length) or b"{}")

    def do_POST(self):
        try:
            data = self._read_json()
        except Exception as e:
            self._send(400, {"ok": False, "error": f"bad json: {e}"})
            return

        if self.path == "/save":
            file_name = Path(str(data.get("fileName", ""))).name
            b64 = data.get("base64Data", "")
            if not file_name or not b64:
                self._send(400, {"ok": False, "error": "need fileName and base64Data"})
                return
            SAVE_DIR.mkdir(parents=True, exist_ok=True)
            dest = SAVE_DIR / file_name
            dest.write_bytes(base64.b64decode(b64))
            self._send(200, {"ok": True, "savedPath": str(dest)})
            return

        if self.path in ("/generate/image", "/generate/video"):
            # No generator wired in yet — say so clearly.
            self._send(
                501,
                {
                    "ok": False,
                    "error": (
                        "No generator wired into bridge.py yet. "
                        "Set GENERATOR_URL env var to your generator, "
                        "or replace this handler with your generator call."
                    ),
                },
            )
            return

        self._send(404, {"ok": False, "error": "not found"})

    def log_message(self, fmt, *args):
        print(f"[{self.address_string()}] {fmt % args}")


if __name__ == "__main__":
    lan_ip = get_lan_ip()
    print(f"DreamForge bridge listening on 0.0.0.0:{PORT}")
    print(f"  From this PC:  http://127.0.0.1:{PORT}/health")
    print(f"  From your phone (same Wi-Fi): http://{lan_ip}:{PORT}/health")
    print(f"  Set in your app: VITE_GENERATOR_LAN_URL=http://{lan_ip}:{PORT}")
    print(f"  PC saves go to: {SAVE_DIR}")
    if not GENERATOR_URL:
        print("  Note: /generate/* returns 501 until GENERATOR_URL is set.")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
