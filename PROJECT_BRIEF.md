# Project Brief – Kam denes

**Verzija:** 0.2
**Datum:** 2026-07-16
**Status:** v1 u produkciji (Faza 1–5 i Faza 8 dovršene, vidi `CHANGELOG.md`)

_Radni naziv projekta promijenjen iz "Kam ve iti" u "Kam denes" 2026-07-16,
prema ažuriranom master promptu (v2) — vidi `CHANGELOG.md`. Infrastruktura
(GitHub repo, Vercel projekt, domena `kamdenes.hr`) još nije preimenovana._

## 1. Problem
Informacije o javnim događanjima u Međimurskoj županiji raspršene su po desetcima izvora (gradovi, općine, turističke zajednice, muzeji, knjižnice, sportski klubovi, lokalni portali, društvene mreže). Korisnik mora ručno pregledavati sve te izvore da bi pronašao događanja koja ga zanimaju.

## 2. Rješenje
Jedinstven web portal koji objedinjuje sva javno dostupna događanja na jednom mjestu, s jednostavnim pregledom po vremenu, kategoriji i lokaciji.

## 3. Ciljana publika
- **Primarna:** stanovnici i posjetitelji Međimurske županije koji traže "što raditi danas / ovaj vikend".
- **Sekundarna (v2+):** organizatori događanja, turističke zajednice.
- **Interna:** administrator portala koji kurira i odobrava sadržaj prije objave (v1), kasnije uz AI asistenciju (v2+).

## 4. MVP opseg (v1) — ULAZI
- Javni prikaz događanja: danas / sutra / ovaj vikend / ovaj tjedan.
- Filtriranje po kategoriji (6 kategorija — vidi `DECISIONS.md`, ADR-013, zamjenjuje ADR-005).
- Filtriranje po lokaciji — pokriva se cijela Međimurska županija od starta (ADR-004).
- Stranica pojedinog događaja (detalji, vrijeme, lokacija, organizator).
- Administratorski unos događaja: ručna forma **i** CSV uvoz, oboje bez AI-a (ADR-004).
- Mobile-first, SEO-optimizirana javna stranica.

## 5. Izvan opsega za v1 — NE ULAZI (planirano za kasnije faze)
- AI automatsko pronalaženje i ekstrakcija događaja (Faza 6–7).
- Prepoznavanje duplikata, automatska kategorizacija (Faza 6).
- Generiranje sažetaka, priprema objava za Facebook/newsletter (Faza 6).
- Korisnički računi, prijava na newsletter, personalizacija (nije definirano, moguće v2+).
- Višejezičnost (nije definirano, moguće v2+).
- **Pretraživanje (search) po naslovu/opisu događaja** — razmotreno 2026-07-16 (master prompt v2) i namjerno izbačeno iz plana; postojeći filter po kategoriji/lokaciji (ADR-008) dovoljno pokriva potrebe dok baza događaja ne naraste.
- **Javni obrazac "Prijavi događaj"** — razmotreno 2026-07-16 (master prompt v2), stavljeno u backlog (§11). Sudara se s ADR-004 (unos isključivo putem admina) i ADR-007 (RLS pretpostavlja "svaki autenticirani korisnik = admin") — treba **novi ADR** prije implementacije jer zahtijeva pravu role-provjeru, ne trenutni pojednostavljeni model.

## 6. Ne-funkcionalni zahtjevi
Jednostavno, brzo, pregledno, modularno, lako održivo, skalabilno, mobile-first, SEO-optimizirano, sigurno, spremno za buduće AI module (obrazloženje: `DECISIONS.md`, ADR-001, ADR-002).

## 7. Tehnološki stack
Next.js + TypeScript, Supabase/PostgreSQL, Vercel, n8n, Python, Claude API — detaljno obrazloženje u `DECISIONS.md` (ADR-001).

## 8. Faze razvoja
1. Definicija projekta i dokumentacije *(u tijeku)*
2. Razvojno okruženje i infrastruktura
3. Baza podataka i podatkovni model
4. Javni portal
5. Administratorski sustav
6. AI moduli
7. Automatizacija prikupljanja
8. Testiranje, optimizacija, SEO, lansiranje

## 9. Riješene odluke (bivša otvorena pitanja)
Sve tri točke potvrđene 2026-07-14, detalji i obrazloženje u `DECISIONS.md`:
- Kategorije događanja → ADR-005 (8 kategorija), zamijenjeno ADR-013 (6 kategorija, 2026-07-20) uvođenjem trorazinskog filter sustava.
- Geografski opseg → ADR-004 (cijela županija od starta).
- Način unosa događaja → ADR-004 (ručna forma + CSV uvoz, bez AI u v1).
- Radni naziv projekta → "Kam denes" (2026-07-16, master prompt v2; prije "Kam ve iti", prije toga "Međimurje Events").

## 10. Dugoročna vizija (v2+)
Projekt dugoročno prerasta iz kalendara događanja u najveći lokalni vodič za
slobodno vrijeme u Međimurju. Ne mijenja opseg v1 (§4) niti arhitekturu sada
— zabilježeno da buduće odluke (podatkovni model, navigacija) ne zatvore
vrata ovom smjeru bez dobrog razloga. Mogući budući sadržajni stupovi, uz
postojeće AI module (Faza 6–7, PROJECT_BRIEF §5, DECISIONS ADR-002):
- Turistički vodiči, restorani, izleti, biciklističke rute.
- Sezonski vodiči (adventski, ljetni), preporuke za vikend.

## 11. Backlog ideja (v2+, bez commitmenta na redoslijed)
Iz master prompta v2 (2026-07-16) — nijedna od ovih nije planirana za v1,
poredak nije prioritetni popis:
- Isticanje: "Događaj dana", "Što danas?", istaknuti/novi/najpopularniji događaji (potonje zahtijeva praćenje pregleda — nema ga u trenutnom podatkovnom modelu).
- Interaktivni kalendar prikaz.
- Karta događaja / interaktivna karta Međimurja (ADR-007 izričito isključuje koordinate/geokodiranje iz v1 — ostaje u backlogu dok se ne odluči drugačije).
- Oznake/tagovi na događaju (npr. besplatno, za djecu, gastro) — različito od 8 fiksnih kategorija (ADR-005), moguća buduća dodatna tablica/many-to-many veza.
- Countdown do početka događaja.
- Vremenska prognoza za događaje na otvorenom (vanjska API integracija).
- Javni obrazac "Prijavi događaj" — vidi §5, treba novi ADR prije rada.

---
_Ovaj dokument je temelj za sve kasnije arhitekturne odluke. Svaka promjena opsega bilježi se kao novi zapis u `DECISIONS.md`._
