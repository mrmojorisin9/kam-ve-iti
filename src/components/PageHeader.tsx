import Image from "next/image";
import Link from "next/link";
import { todayInZagreb } from "@/lib/events";
import { formatHeaderDate } from "@/lib/format";

/**
 * Hero — ista tehnika na oba širine (korisnikov zahtjev nakon dva prijašnja
 * pokušaja): puna fotografija preko cijele kutije, dijagonalna tamna ploča
 * s tekstom pri dnu, CTA koji "pluta" na fotografiji. Razlika mobitel/
 * desktop je SAMO u tome je li kutija puna-širine ("full-bleed") ili
 * ograničena na sadržajni stupac — ne u internom rasporedu.
 *
 * Povijest (vidi CHANGELOG.md za pune detalje):
 * - Dan 65: full-bleed na oba širine (desktop "traka-banner" preko cijelog
 *   ekrana) — korisnik odbio, edge-to-edge na desktopu ne pristaje uz
 *   ograničen sadržajni stupac ostatka portala.
 * - Dan 66: desktop prebačen na razdvojen raspored (tekst lijevo/foto
 *   desno, ~42% kolona) — korisnik odbio, uska kolona loše reže fotografiju
 *   s jasnim središnjim motivom (osoba/motocikl), gradient+blur na mobitelu
 *   loše izgledali.
 * - Ovo (Dan 67): natrag na Dan 65 tehniku, ali desktop kutija OGRANIČENA
 *   na `mx-auto max-w-* px-6` (identične klase kao `<main>`) umjesto
 *   edge-to-edge, i BEZ gradient/blur omekšavanja (korisnikov zahtjev —
 *   izgledalo loše).
 *
 * Mobitel mora ostati IZVAN `max-w-*`/`px-6` sadržajnog `<main>`-a (vidi
 * DayView/RangeView/pretraga/page.tsx) da bi full-bleed stvarno bio
 * pun-širinski — `<body>` (layout.tsx) nema vlastiti padding pa hero kao
 * izravno dijete tijela prirodno puni širinu kad nema vlastitih
 * `max-w`/`px` klasa.
 *
 * Podnaslov je uvijek današnji datum, bez obzira na aktivni tab
 * (Danas/Sutra/Vikend/Tjedan) — korisnikov raniji zahtjev, hero panel se ne
 * mijenja ovisno o prikazanom rasponu događaja.
 *
 * Prva upotreba `next/image` u portalu — izvorna fotografija (`hero.jpg`)
 * je prevelika (nekoliko MB) da se posluži izravno; `next/image`
 * automatski generira optimizirane/responzivne varijante po zahtjevu.
 */
export function PageHeader() {
  return (
    <header className="relative w-full sm:mx-auto sm:max-w-2xl sm:px-6 sm:py-6 md:max-w-3xl lg:max-w-5xl">
      <div className="border-line relative h-[42vh] max-h-[480px] min-h-[320px] w-full overflow-hidden sm:h-[380px] sm:max-h-none sm:min-h-0 sm:rounded-xl sm:border sm:shadow-lg sm:shadow-black/20">
        {/* Omot koji stvarno pomiče sadržaj fotografije na mobitelu (Dan
            70) — `object-position` (Dan 68/69) je bio no-op: mobilni okvir
            (~1.10 omjer) je "uži" od fotografije (4640×3472, ~1.34 omjer),
            pa `object-fit: cover` uvijek prikazuje CIJELU visinu bez ikakvog
            vertikalnog prostora za pomicanje (sav višak se reže isključivo
            lijevo/desno). Ovaj omot je namjerno viši od kutije (`117.65%`,
            usidren na dnu) — fotografija unutra opet radi cover-fit, ali
            sad prema OVOM VIŠEM omotu, ne prema kutiji; kutija (roditelj,
            `overflow-hidden`) prikazuje samo donjih 85% omota. Time se
            gornjih 15% izvorne fotografije (nebo/krošnje) žrtvuje, a
            preostalih 85% sadržaja vizualno "pomiče gore" u kutiji —
            motocikl (bio na ~47-68% od vrha) sad sjedi iznad dijagonalne
            ploče umjesto da je ona presijeca. Desktop (`sm:inset-0
            sm:h-full`) vraća se na obično 1:1 popunjavanje kutije,
            nepromijenjeno. */}
        <div className="absolute inset-x-0 bottom-0 h-[117.65%] sm:inset-0 sm:h-full">
          <Image
            src="/hero.jpg"
            alt=""
            fill
            preload
            sizes="(min-width: 640px) 1024px, 100vw"
            className="object-cover"
          />
        </div>

        {/* Dijagonalna tamna ploča — tekst uvijek sjedi na punom kontrastu.
            Namjerno BEZ gradient zatamnjenja i BEZ blur omekšavanja
            (korisnikov zahtjev, oboje prije loše izgledalo) — čist rez. */}
        <div
          aria-hidden="true"
          className="bg-night absolute inset-x-0 bottom-0 h-[55%] [clip-path:polygon(0_30%,100%_10%,100%_100%,0_100%)] sm:h-[58%]"
        />

        {/* CTA "pluta" izravno na fotografiji — staklen efekt. Prva verzija
            (`bg-night/40` + `text-parchment-muted` + `backdrop-blur-sm`)
            loše čitljiva preko svijetlih dijelova fotografije (npr. nebo) —
            slaba prozirnost + slab blur + prigušena boja teksta zajedno nisu
            davali dovoljan kontrast. Popravljeno: jači `backdrop-blur-md`
            (vidljivo zamućenje pozadine iza gumba, jasan "staklen" dojam
            umjesto blijede mrlje boje), veća neprozirnost pozadine
            (`bg-night/60`), svjetliji `text-parchment` (umjesto muted),
            deblji tekst (`font-semibold`) i vidljiviji obrub
            (`border-white/15`) — svaka pojedinačna promjena mala, zajedno
            pouzdano čitljivo neovisno o tome što je ispod na fotografiji. */}
        <Link
          href="/prijavi-dogadaj"
          className="bg-night/60 text-parchment hover:bg-night/75 hover:text-gold focus-visible:outline-gold absolute top-6 left-6 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-xs font-semibold shadow-lg shadow-black/40 backdrop-blur-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 sm:top-10 sm:left-10"
        >
          + Prijavi događaj
        </Link>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-10">
          <div>
            <p className="text-parchment-muted font-mono text-xs tracking-[0.2em] uppercase">
              Međimurska županija
            </p>
            <h1 className="font-display text-parchment mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
              <Link
                href="/"
                className="focus-visible:outline-gold rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                <span className="text-gold">K</span>am denes
              </Link>
            </h1>
            <p className="text-gold mt-3 font-mono text-sm capitalize">
              {formatHeaderDate(todayInZagreb())}
            </p>
          </div>

          {/* Na mobitelu se pretraga seli pokraj "Još filtara" gumba u
              FilterBar-u (Dan 61) — ovdje ostaje samo za sm+. */}
          <form
            method="get"
            action="/pretraga"
            role="search"
            className="border-line bg-oak focus-within:border-gold/60 hidden w-full max-w-xs items-center gap-1 rounded-full border py-1.5 pr-1.5 pl-4 shadow-sm shadow-black/10 transition-colors sm:flex"
          >
            <input
              type="search"
              name="q"
              placeholder="Pretraži događaje…"
              aria-label="Pretraži događaje"
              className="text-parchment placeholder:text-parchment-muted min-w-0 flex-1 bg-transparent py-1 text-sm focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Pretraži"
              className="bg-gold text-night hover:bg-gold/90 focus-visible:outline-gold flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span aria-hidden="true">🔍</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
