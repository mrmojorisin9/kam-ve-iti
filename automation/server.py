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
    # Prisutnost parametra (cak i bez vrijednosti, ?export_csv) trazi izvoz;
    # izostanak parametra (None) ga iskljucuje — vidi pipeline.run() docstring.
    # NAPOMENA: unutar Docker kontejnera ovo pise na kontejnerov filesystem
    # (automation/exports/), koji NIJE volume-mountan u docker-compose.yml —
    # datoteka ce postojati unutar kontejnera (dohvatljivo preko
    # `docker cp`/`docker exec`), ali se ne pojavljuje automatski na hostu
    # dok se ne doda volume. Za CSV dohvatljiv izravno na disku, koristiti
    # CLI (`python -m automation.pipeline --export-csv`) lokalno.
    export_csv = request.args.get("export_csv")

    if source not in ADAPTERS:
        return jsonify(
            {"error": f"nepoznat izvor '{source}'. dostupno: {list(ADAPTERS)}"}
        ), 400

    stats = run(source, dry_run, export_csv=export_csv)
    return jsonify({"source": source, "dry_run": dry_run, "stats": stats})
