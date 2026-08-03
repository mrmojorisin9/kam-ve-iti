# Kam denes — automation/ kao zaseban HTTP servis (Faza 6-7, ADR-020, Korak 5).
#
# n8n-ov sluzbeni Docker image je "Docker Hardened Image" — apk/apt je
# namjerno uklonjen iz sigurnosnih razloga, potvrdeno na SVIM tagovima
# (:latest, :1) probom uzivo prije ovog Dockerfilea. Python se zato NE
# moze instalirati u isti kontejner kao n8n (prvotni plan) — automation/
# radi kao zaseban, standardni python:3.12-slim servis; n8n ga poziva
# HTTP Request cvorom (ne Execute Command) preko interne Docker mreze
# (vidi docker-compose.yml, `automation/server.py`).
#
# Build context MORA biti korijen repoa (docker-compose.yml, `context: ../..`).
FROM python:3.12-slim

WORKDIR /repo
COPY automation/requirements.txt automation/requirements.txt
RUN pip install --no-cache-dir -r automation/requirements.txt
COPY automation/ automation/

EXPOSE 8000
CMD ["python", "-m", "flask", "--app", "automation.server", "run", "--host=0.0.0.0", "--port=8000"]
