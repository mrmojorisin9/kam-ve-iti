"""Minimalni HTTP wrapper oko pipeline.py (Faza 6-7, ADR-020, Korak 5).

n8n-ov sluzbeni Docker image je "Docker Hardened Image" (apk/apt namjerno
uklonjen iz sigurnosnih razloga, potvrdeno na svim tagovima) — Python se
ne moze instalirati u ISTI kontejner kao n8n (izvorni plan iz prve verzije
ADR-020 Koraka 5). automation/ zato radi kao zaseban servis (standardni
`python:3.12-slim`), pozvan preko n8n "HTTP Request" cvora unutar iste
Docker Compose mreze, ne preko "Execute Command" cvora.

Pokretanje: `flask --app automation.server run --host=0.0.0.0 --port=8000`
(vidi automation/deploy/Dockerfile).
"""

from flask import Flask, jsonify, request

from .adapters import ADAPTERS
from .pipeline import run

app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/run")
def run_endpoint():
    source = request.args.get("source", "")
    dry_run = request.args.get("dry_run", "false").lower() == "true"

    if source not in ADAPTERS:
        return jsonify(
            {"error": f"nepoznat izvor '{source}'. dostupno: {list(ADAPTERS)}"}
        ), 400

    stats = run(source, dry_run)
    return jsonify({"source": source, "dry_run": dry_run, "stats": stats})
