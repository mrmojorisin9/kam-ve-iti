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
promjene ijedne linije koda — isti `docker-compose.yml`, samo drugi host.

**Druga promjena, otkrivena tek pri prvom pokušaju builda:** n8n-ov
službeni Docker image je "Docker Hardened Image" — Alpine bez package
managera (`apk`), namjerno uklonjenog iz sigurnosnih razloga, potvrđeno
na svim tagovima koje smo probali. Zato Python **ne može** živjeti u
istom kontejneru kao n8n (izvorni jednokontejnerski plan). Umjesto toga:
**dva kontejnera** — `n8n` (nepromijenjen službeni image) i `automation`
(standardni `python:3.12-slim`, mali Flask HTTP servis oko
`pipeline.py`). n8n poziva `automation` preko HTTP Request čvora unutar
iste Docker mreže, ne preko Execute Command čvora.

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
kao lokalni `automation/.env`):

```
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

Prvi put traje par minuta (`n8n` image se preuzima nepromijenjen,
`automation` image se gradi — instalira Python ovisnosti). Prati napredak
s:

```bash
docker compose logs -f
```

(Ctrl+C za izlaz iz praćenja loga — kontejneri nastavljaju raditi u
pozadini.)

## 4. Provjeri da automation servis radi

```bash
curl http://localhost:8000/health
```

Očekivano: `{"status":"ok"}`. Ako želiš, možeš i ručno okinuti scraper
bez n8n-a (isti kod, samo preko HTTP-a umjesto CLI-ja):

```bash
curl -X POST "http://localhost:8000/run?source=emedjimurje&dry_run=true"
```

## 5. Pristup n8n sučelju — kreiranje owner računa

Otvori **`http://localhost:5678`** u pregledniku. Kod prvog otvaranja n8n
prikazuje **svoj vlastiti ekran za postavljanje** (ne login formu) — traži
da kreiraš "owner" račun: email (može biti bilo koji, samo za tebe, ne
mora biti dohvatljiv) + ime + lozinka. To postaje tvoj stalni login za
ovu instancu ubuduće (zapiši lozinku).

## 6. Uvoz workflowa i podešavanje

1. n8n sučelje → **Workflows → Import from File** → odaberi
   `automation/n8n/scraper-workflow.json` sa svog računala.
2. Otvori uvezeni workflow, provjeri "Cron (dnevno)" čvor (vrijeme po
   želji) i "HTTP Request" čvor (URL/parametri su već točni — poziva
   `automation` servis preko interne Docker mreže).
3. **Aktiviraj workflow** (toggle gore desno).
4. Test: klikni "Execute Workflow" ručno jednom, provjeri output "HTTP
   Request" čvora — treba vratiti JSON sa statistikom (`inserted`,
   `updated`, `skipped_duplicate`, `skipped_extraction`), isto kao ono
   što si već vidio u terminalu kod ručnog pokretanja.
5. Provjeri `/admin/dogadjaji?status=pending_review` na portalu — novi/
   ažurirani redovi trebaju se pojaviti nakon uspješnog pokretanja.

## 7. CSV izvoz preko n8n-a (opcionalno)

Uz upis u bazu, svako pokretanje (ručno ili cron) može dodatno spremiti i
pregledan CSV popis obrađenih događaja — vidi
`automation/UPUTE-CSV-IZVOZ.md` za objašnjenje stupaca/statusa. Preko n8n-a:

1. Otvori "HTTP Request" čvor u workflowu.
2. U query parametrima dodaj `export_csv` (bez vrijednosti je dovoljno —
   automatski generira naziv datoteke).
3. Spremi i (ponovno) aktiviraj workflow.

`docker-compose.yml` bind-monta `automation/exports/` iz kontejnera na
**istu** mapu na hostu koju koristi i lokalni CLI (`python -m
automation.pipeline --export-csv`) — datoteka se pojavljuje izravno u
`automation/exports/` na disku nakon svakog pokretanja, bez dodatnih
koraka. Ako je `docker-compose.yml` mijenjan NAKON zadnjeg
`docker compose up -d`, treba `docker compose up -d` ponovno (volumeni se
primjenjuju pri (re)kreiranju kontejnera, ne pri rebuildu slike) da bind
mount stvarno proradi.

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
