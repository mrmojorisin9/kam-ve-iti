# Kam denes — n8n + automation/ u istom kontejneru (Faza 6-7, ADR-020, Korak 5).
#
# Zasto isti kontejner umjesto odvojenog Python servisa: n8n sluzbena slika
# je Node/alpine bez Pythona. Umjesto drugog servisa + HTTP mosta izmedu
# njih (dodatna kompleksnost bez stvarnog razloga za jedan cron-pokrenut
# CLI, ADR-006 duh), n8n-ov "Execute Command" cvor jednostavno pokrece
# python izravno u ISTOM kontejneru gdje je i repo kopiran.
#
# Build context MORA biti korijen repoa (ne automation/deploy/), zbog
# `COPY . /repo` niže — vidi docker-compose.yml (`context: ../..`,
# `dockerfile: automation/deploy/Dockerfile`).
FROM docker.n8n.io/n8nio/n8n:latest

USER root
RUN apk add --no-cache python3 py3-pip

COPY --chown=node:node . /repo
WORKDIR /repo

RUN python3 -m venv /repo/automation/.venv \
    && /repo/automation/.venv/bin/pip install --no-cache-dir -r automation/requirements.txt

USER node
