# Project Brief – Kam ve iti

**Verzija:** 0.1 (nacrt – Faza 1)
**Datum:** 2026-07-14
**Status:** Draft za review

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
- Filtriranje po kategoriji (8 kategorija — vidi `DECISIONS.md`, ADR-005).
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
- Kategorije događanja → ADR-005 (8 kategorija).
- Geografski opseg → ADR-004 (cijela županija od starta).
- Način unosa događaja → ADR-004 (ručna forma + CSV uvoz, bez AI u v1).

---
_Ovaj dokument je temelj za sve kasnije arhitekturne odluke. Svaka promjena opsega bilježi se kao novi zapis u `DECISIONS.md`._
