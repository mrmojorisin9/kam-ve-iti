# Upute — CSV izvoz iz scraper pipelinea

Kratak praktičan vodič za pokretanje scrapera s CSV izvozom (uz postojeći
upis u Supabase, ne umjesto njega). Tehnički detalji implementacije su u
`CHANGELOG.md` (unos "opcionalan CSV izvoz iz scraper pipelinea") i
`automation/README.md`.

`automation/.venv` (Python okruženje) i `automation/.env` (kredencijali) već
postoje na ovom računalu — nije potreban dodatni setup, samo pokretanje.

## 1. Otvori PowerShell u korijenu projekta

```powershell
cd "F:\PYTHON\kam_ve_iti\kam-ve-iti"
```

## 2. Aktiviraj Python virtualno okruženje

```powershell
automation\.venv\Scripts\Activate.ps1
```

Prompt dobiva prefiks `(.venv)` — to znači da se koristi ispravan Python s
već instaliranim ovisnostima (Supabase klijent, Anthropic SDK itd.), ne
sistemski Python.

## 3. Odaberi izvor

Trenutno postoje 4 registrirana izvora:

| Naziv za `--source` | Izvor          |
| -------------------- | --------------- |
| `emedjimurje`         | emedjimurje.net.hr |
| `mnovine`             | mnovine.hr       |
| `prelog`              | prelog.hr        |
| `evento`              | evento.sh        |

## 4. Prvi pokušaj — UVIJEK prvo s `--dry-run`

```powershell
python -m automation.pipeline --source emedjimurje --dry-run --export-csv
```

**Što ovo radi:**

- Dohvaća sve događaje s izvora
- Šalje Claude-u na ekstrakciju/kategorizaciju **samo one koji su novi ili
  su se promijenili** od zadnjeg pokretanja (nepromijenjeni se prepoznaju po
  sadržaju i preskaču, bez Claude poziva — to je jedina ušteda ovdje)
- **NE upisuje ništa u Supabase bazu** (to je poanta `--dry-run`)
- Ispisuje u terminal što bi se dogodilo, red po red
- **I dalje** stvara CSV datoteku (jer je dodan `--export-csv`) — CSV izvoz
  ne ovisi o tome piše li se u bazu

⚠️ **Važna napomena o trošku:** `--dry-run` štedi na upisu u bazu, ali **ne
štedi na Claude API pozivima** — ako izvor ima npr. 15 novih/promijenjenih
događaja, to je i dalje 15 stvarnih (plaćenih) poziva Claude-u, bilo s
`--dry-run` bilo bez njega. `--dry-run` je siguran za "što bi se dogodilo s
bazom", ne za "besplatno probaj".

## 5. Pronađi CSV

Nakon što terminal ispiše nešto poput:

```
[emedjimurje] CSV izvoz: automation\exports\emedjimurje_20260812_143022.csv (23 redaka)
[emedjimurje] gotovo: {...}
```

Datoteka je u `automation\exports\` — otvori je dvoklikom, otvara se
izravno u Excelu (hrvatska slova se ispravno prikazuju, UTF-8 s BOM-om).
Stupac **`status`** govori što se dogodilo sa svakim redom:

| status                                       | značenje                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| `nov`                                         | novi događaj, spreman za upis (čeka odobrenje admina u `/admin/dogadjaji`) |
| `azurirano (postojeci)`                       | već postoji u bazi, ovaj scrape ga osvježava                            |
| `preskoceno (vjerojatan duplikat)`            | izgleda kao isti događaj koji već postoji pod drugim izvorom            |
| `ekstrakcija neuspjela`                       | Claude nije uspio pouzdano pročitati podatke — ručno provjeriti izvor    |
| `nepromijenjeno (preskoceno)`                 | identično kao prošli put, nije ni slano Claude-u                        |
| `nije obradeno (dosegnut sigurnosni strop)`   | rijetko — previše zapisa odjednom, sigurnosni limit ga je zaustavio     |

## 6. Kad si zadovoljan/na — stvaran upis u bazu + CSV

Kad odlučiš da stvarno želiš upisati u Supabase (ne samo probu), makni
`--dry-run`:

```powershell
python -m automation.pipeline --source emedjimurje --export-csv
```

Ovo radi identično kao dosad (upisuje nove/ažurira postojeće u bazu, novi
idu kao `pending_review` — čekaju tvoje odobrenje na `/admin/dogadjaji`),
**plus** dobiješ isti pregledni CSV.

## 7. Bez CSV-a (samo kao dosad)

Ako u nekom trenutku ne želiš CSV, jednostavno izostavi `--export-csv`:

```powershell
python -m automation.pipeline --source emedjimurje
```

## 8. Za drugi izvor

Samo promijeni `--source`, npr.:

```powershell
python -m automation.pipeline --source evento --export-csv
```

## 9. Napomena o automatskom cron pokretanju (n8n)

Postojeći automatski dnevni cron u n8n-u (kad je računalo upaljeno i Docker
Desktop pokrenut) **nastavlja raditi identično kao dosad** — CSV izvoz se ne
uključuje sam od sebe, mora se ručno pokrenuti preko terminala kao gore. Ako
bi trebalo da i automatski cron pravi CSV, to bi zahtijevalo dodatnu
izmjenu (dodavanje "volumena" u Docker konfiguraciju da datoteka uopće bude
dohvatljiva izvan kontejnera) — to trenutno nije uključeno.
