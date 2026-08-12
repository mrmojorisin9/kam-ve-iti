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

### CSV izvoz (uz upis u bazu, ne umjesto njega)

```bash
python -m automation.pipeline --source emedjimurje --export-csv
```

Uz normalan upis u Supabase, sprema i pregledan popis **svih** obrađenih
zapisa iz tog pokretanja (novi/ažurirani/preskočeni duplikat/neuspjela
ekstrakcija/nepromijenjeno — vidi stupac `status`) u
`automation/exports/<izvor>_<vrijeme>.csv` (UTF-8 s BOM-om, otvara se
ispravno u Excelu s hrvatskom dijakritikom). Radi i uz `--dry-run` (CSV
nastaje bez ikakvog upisa u bazu). Za točnu putanju:
`--export-csv putanja/do/datoteke.csv`. Isti parametar postoji na `/run`
HTTP endpointu (`?export_csv`) — napomena o Docker volumenu u
`server.py` komentaru ako se koristi preko n8n-a.

## n8n hosting (ADR-020, Korak 5)

Docker Compose setup — n8n self-hosted **lokalno preko Docker Desktopa**
(Oracle Cloud VM plan napušten zbog blokirane registracije, vidi ADR-020
dopunu 2026-08-03) — vidi **`automation/deploy/README.md`** za kompletne
korake (Docker Desktop instalacija, `docker compose up`, uvoz
`n8n/scraper-workflow.json`, prvi live test). Prihvaćen kompromis: cron
okida samo dok je računalo upaljeno i Docker Desktop pokrenut.

## Razmotreni i odbačeni izvori

- **visitmedimurje.com/en/events/** (2026-08-03) — nije kalendar. Cijela
  stranica je jedan marketinški odlomak teksta koji nabraja poznate
  godišnje festivale, bez pojedinačnih datuma/kartica/linkova. Nema
  navigacije prema strukturiranijoj kalendar-stranici na tom domenu.
  Ponovno razmotriti ako se stranica promijeni ili se pronađe druga URL.
- **msm.hr** (2026-08-03) — sportski news portal (transferi, izvještaji s
  odigranih utakmica), ne kalendar. Uzorak od 55 najnovijih naslova dao
  je samo 1 naslov nalik najavi događaja, i taj je vjerojatno već u bazi
  s drugog izvora. Korisnikova odluka: preskočiti, nizak prinos ne
  opravdava održavanje adaptera. Ponovno razmotriti ako se pronađe
  konkretnija stranica (npr. službeni raspored lige/saveza).
- **medjimurjepress.net/vijesti/najave/** (2026-08-07) — nije kalendar
  događaja unatoč nazivu URL-a. Opći lokalni news portal (Penci
  WordPress tema) — uzorak ~17 naslova bio je kronika (krađe/provale),
  policijske objave, osmrtnice, politika; "najave" ovdje znači "javne
  objave", ne najave događaja. 0/17 stvarnih najava — isti profil kao
  msm.hr, ista odluka.

## Odgođeni izvori (tehnicki razlog, ne kvaliteta)

- **evento.sh/ck** (2026-08-07) — potvrđeno da je ovo stvarna
  Međimurska županija stranica na profesionalno građenoj event-platformi
  (kategorija/geolokacija/slika već gotovi po događaju, ~20 događaja u
  jednom prefetch popisu) — potencijalno najbogatiji kandidat od svih
  razmotrenih. Podaci se NE nalaze u statičnom HTML-u (moderna React
  Router SPA) — stvaran JSON API (`api.evento.sh/api`) postoji i vraća
  prave zapise, ali pogodeni parametar filtriranja po županiji
  (`countyCode=ck`) vratio je nepovezan događaj iz Istre umjesto
  Međimurja, znači stvaran oblik zahtjeva nije pouzdano utvrđen ovom
  analizom. Treba zaseban zadatak fokusiran na hvatanje stvarnog mrežnog
  zahtjeva (Browser pane network inspekcija dok stranica radi, ne samo
  statični `curl`) prije pisanja adaptera. Korisnikova odluka: odgoditi,
  ne trošiti dodatno vrijeme u ovoj sesiji.

## Dodavanje novog izvora

**Prije pisanja ijednog retka adaptera — analiza izvora (besplatno, bez
Claude poziva).** Formalizacija postupka koji je već ručno proveden za
`visitmedimurje.com`/`msm.hr` (odbačeni) i `mnovine.hr` (prihvaćen), vidi
"Razmotreni i odbačeni izvori" gore. Cilj: ne pisati/održavati adapter za
izvor koji će ionako imati nizak prinos ili se pokazati skupim/dupliciranim
prije nego se to ustanovi bez trošenja kredita.

1. **Je li ovo uopće kalendar?** Ručni pregled stranice (`curl` ili
   preglednik) — traži se strukturirana lista zapisa s pojedinačnim
   datumima/karticama/linkovima, ne slobodni marketinški tekst ili news
   feed. Provjeriti i eventualne AJAX/REST pozive (network inspekcija) prije
   zaključka "nema strukture" — `visitmedimurje.com` je odbačen tek nakon te
   provjere, ne samo pregledom vidljivog HTML-a.
2. **Isti WordPress "The Events Calendar" plugin kao postojeći izvori?**
   Prepoznatljivi `tribe-events` CSS razredi (vidi `adapters/tribe_events.py`
   komentar). Ako da, novi adapter je gotovo besplatan — tanki subclass
   `TribeEventsListAdapter` (`source_name`/`start_url`), isti obrazac kao
   `emedjimurje.py`/`mnovine.py`. Čest slučaj kod HR lokalnih portala.
3. **Uzorak ~20 naslova ručno** — koliki postotak stvarno izgleda kao
   najava budućeg događaja (ne transfer/news vijest, ne trajna ponuda s
   nerealnim rasponom godina)? `msm.hr` odbačen jer je od 55 naslova samo 1
   nalikovao najavi — nizak prinos ne opravdava održavanje adaptera.
4. **Regionalno preklapanje s postojećim izvorima?** `emedjimurje.net.hr` i
   `mnovine.hr` dijele dio regionalne baze događaja (dokazano "Notorious
   Festival" slučajem, ADR-020 dopuna) — provjeriti ručno je li nekoliko
   naslova iz uzorka (korak 3) već prisutno na postojećem izvoru prije
   pisanja adaptera. Dedup sloj (`dedup.py`) i dalje hvata preklapanje na
   razini baze, ali svaki preklapajući zapis je Claude poziv koji dedup
   naknadno odbaci — jeftinije je unaprijed znati razmjer preklapanja.
5. Tek nakon 1-4 → pisanje adaptera (korak ispod) i **jedan** dry-run test
   protiv stvarnog izvora, ne ponovljeni pokušaji uživo.

**Implementacija:** implementirati `SourceAdapter` (vidi
`adapters/emedjimurje.py` kao primjer, ili naslijediti
`TribeEventsListAdapter` iz koraka 2), registrirati u `adapters/__init__.py`
(`ADAPTERS` mapa). `pipeline.py`, `extract.py`, `dedup.py` ne trebaju
izmjenu — rade nad `RawEvent` sučeljem bez obzira na izvor.
