# n8n self-hosted lokalno, Docker Desktop (Faza 6-7, ADR-020, Korak 5)

**Promjena u odnosu na prvotni plan (Oracle Cloud VM):** Oracle Cloud
registracija je blokirana njihovim sustavom za sprječavanje prijevara
(česta, nepredvidiva pojava kod njih, izvan naše kontrole). Umjesto
čekanja na njihov support, n8n se pokreće lokalno na tvom Windows
računalu preko Docker Desktopa — isti Docker Compose setup, samo bez
VM-a/SSH tunela između.

**Prihvaćen kompromis:** cron unutar n8n-a okida SAMO dok je tvoje
računalo upaljeno i Docker Desktop pokrenut (ne mora biti aktivno
korišteno, ali ne smije biti ugašeno/u dubokom mirovanju). Ako se to
pokaže nepraktičnim (npr. računalo redovito gasiš navečer, a scraping je
zakazan za to vrijeme), premještanje na pravi VM ostaje moguće bez
promjene ijedne linije koda — isti `Dockerfile`/`docker-compose.yml`,
samo drugi host.

## 1. Instaliraj Docker Desktop

1. Preuzmi s [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) (Windows verzija).
2. Instaliraj — instalater će vjerojatno tražiti uključivanje **WSL2**
   (Windows Subsystem for Linux) ako već nije uključen; prati upute na
   ekranu, treba restart računala.
3. Nakon restarta, pokreni Docker Desktop (ikona u sistem trayu treba
   postati "Docker Desktop is running" — zeleno).

## 2. Konfiguracija

U Git Bash ili PowerShell, iz korijena repoa:

```bash
cd automation/deploy
cp .env.example .env
```

Otvori novonastali `.env` u bilo kojem editoru i popuni (iste vrijednosti
kao lokalni `automation/.env`, plus login za n8n sučelje):

```
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=<smisli jaku lozinku>
SUPABASE_URL=<isto kao automation/.env>
SUPABASE_SERVICE_ROLE_KEY=<isto kao automation/.env>
ANTHROPIC_API_KEY=<isto kao automation/.env>
SCRAPER_USER_ID=<isto kao automation/.env>
```

## 3. Pokretanje

I dalje u `automation/deploy/`:

```bash
docker compose up -d --build
```

Prvi put traje par minuta (build image-a — instalira Python i ovisnosti
unutar kontejnera). Prati napredak s:

```bash
docker compose logs -f n8n
```

(Ctrl+C za izlaz iz praćenja loga — kontejner nastavlja raditi u
pozadini.)

## 4. Pristup n8n sučelju

Otvori **`http://localhost:5678`** u pregledniku. Prijava s
`N8N_BASIC_AUTH_USER`/`PASSWORD` iz `.env` iznad.

## 5. Uvoz workflowa i podešavanje

1. n8n sučelje → **Workflows → Import from File** → odaberi
   `automation/n8n/scraper-workflow.json` sa svog računala.
2. Otvori uvezeni workflow, provjeri "Cron (dnevno)" čvor (vrijeme po
   želji) i "Execute Command" čvor (naredba je već točna).
3. **Aktiviraj workflow** (toggle gore desno).
4. Test: klikni "Execute Workflow" ručno jednom, provjeri output
   "Execute Command" čvora — treba izgledati kao ispis iz `pipeline.py`
   koji si već vidio kod ručnog pokretanja.
5. Provjeri `/admin/dogadjaji?status=pending_review` na portalu — novi/
   ažurirani redovi trebaju se pojaviti nakon uspješnog pokretanja.

## Održavanje (buduće izmjene koda)

Nakon izmjene bilo čega u `automation/` (novi izvor, popravak adaptera):

```bash
cd automation/deploy
docker compose up -d --build
```

Rebuild podigne novi kod bez gubitka n8n workflow povijesti (`n8n_data`
je odvojen Docker volume, nedirano rebuild-om). Git commit/push nije
preduvjet za rebuild lokalno (za razliku od VM-scenarija koji bi trebao
`git pull`) — Docker gradi izravno iz tvog lokalnog radnog direktorija.

## Gašenje

```bash
docker compose down
```

Zaustavlja kontejner (cron prestaje okidati). `n8n_data` volume ostaje
(workflow definicije se ne gube) — `docker compose up -d` ga vraća u
prijašnje stanje.

## Ako se kasnije odlučiš za VM (Oracle Cloud ili drugi)

Isti `Dockerfile`/`docker-compose.yml` rade nepromijenjeni na bilo kojem
Linux VM-u s Dockerom — jedina razlika je `git clone` umjesto lokalnog
repoa i SSH tunel (`ssh -L 5678:localhost:5678 ...`) umjesto izravnog
`localhost:5678`, jer bi tada n8n radio na udaljenom stroju. Javi kad
budeš spreman za to, doradit ćemo README s tim koracima.
