# automation/ — automatizirano prikupljanje događaja

Faza 6-7 (PROJECT_BRIEF §8), arhitektura i odluke: `DECISIONS.md` ADR-020.
Pilot izvor: [emedjimurje.net.hr/dogadjaji/lista/](https://emedjimurje.net.hr/dogadjaji/lista/).

## Kako radi

`pipeline.py` je samostalan CLI (nema ovisnosti o n8n-u da bi se pokrenuo):

1. Adapter (`adapters/`) dohvaća sirove zapise s izvora (HTML/RSS/JSON, po
   izvoru drugačije — vidi `adapters/base.py` za sučelje).
2. `extract.py` šalje svaki zapis Claude API-ju da ga normalizira: naslov,
   opis, ISO datum/vrijeme (Europe/Zagreb), i mapira slobodni tekst
   kategorije/lokacije na **stvarne slugove iz baze** (proslijeđene u
   promptu — model ne smije izmišljati nepostojeće).
3. `dedup.py` + `db.py` provjeravaju duplikate: točan `source_url` pogodak
   postaje update umjesto novog inserta; fuzzy usporedba naslova (isti
   dan/lokacija) hvata isti događaj unesen ručno ili s drugog izvora.
4. Novi događaji idu u `events` sa `status='pending_review'` — pojavljuju
   se u `/admin/dogadjaji?status=pending_review` sa 🔗 izvor bedžom i mogu
   se bulk odobriti/odbaciti.

## Jednokratni setup (prije prvog pokretanja)

1. **Dedicated "scraper" Supabase Auth korisnik** (Supabase Dashboard →
   Authentication → Add user, npr. `scraper@internal.kamdenes.hr`, jaka
   nasumična lozinka — nikad se ne koristi za prijavu). Kopirati njegov
   `id` (UUID) u `SCRAPER_USER_ID`.

   **Zašto je ovo obavezno, ne opcionalno:** `enforce_public_submission_
   rate_limit` trigger (`0020_public_submission_rate_limit.sql`) broji
   SVAKI insert (ne samo anon rolu) gdje je `status='pending_review' AND
   created_by IS NULL`, prema globalnom pragu 5/10min namijenjenom javnoj
   prijavi (ADR-016). Scraper insert s `created_by=NULL` bi dijelio taj
   isti budžet i mogao bi biti odbijen nakon svega 5 upisa po pokretanju.
   `created_by` = scraper UUID (ne NULL) u potpunosti izbjegava taj uvjet.

2. Primijeniti migraciju `supabase/migrations/0024_scraper_source_and_
   dedup.sql` na Supabase instancu (ako već nije).

3. `cp .env.example .env` i popuniti: `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` (service_role, NE anon ključ),
   `ANTHROPIC_API_KEY`, `SCRAPER_USER_ID` (iz koraka 1).

4. `pip install -r requirements.txt` (preporučeno u virtualenv-u:
   `python -m venv .venv`).

## Pokretanje lokalno

```bash
python -m automation.pipeline --source emedjimurje --dry-run
```

Ispisuje što bi se dogodilo (novi/update/preskočeni duplikat/preskočena
nesigurna ekstrakcija) bez upisa u bazu. **Napomena:** dry-run i dalje
čita iz baze (za dedup provjeru) — treba stvarne kredencijale, samo
insert/update pozivi su isključeni.

```bash
python -m automation.pipeline --source emedjimurje
```

Stvarni upis. Provjeriti rezultat u `/admin/dogadjaji?status=pending_review`.

## n8n hosting (ADR-020, Korak 5)

Docker Compose setup — n8n self-hosted **lokalno preko Docker Desktopa**
(Oracle Cloud VM plan napušten zbog blokirane registracije, vidi ADR-020
dopunu 2026-08-03) — vidi **`automation/deploy/README.md`** za kompletne
korake (Docker Desktop instalacija, `docker compose up`, uvoz
`n8n/scraper-workflow.json`, prvi live test). Prihvaćen kompromis: cron
okida samo dok je računalo upaljeno i Docker Desktop pokrenut.

## Dodavanje novog izvora

Implementirati `SourceAdapter` (vidi `adapters/emedjimurje.py` kao
primjer), registrirati u `adapters/__init__.py` (`ADAPTERS` mapa).
`pipeline.py`, `extract.py`, `dedup.py` ne trebaju izmjenu — rade nad
`RawEvent` sučeljem bez obzira na izvor.
