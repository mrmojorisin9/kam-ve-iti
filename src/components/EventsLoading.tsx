/**
 * Skeleton prikazan dok Server Component čeka Supabase upit (App Router
 * `loading.tsx` konvencija). `role="status"` + `sr-only` tekst javljaju
 * stanje čitačima ekrana — pulsirajući blokovi sami po sebi ništa ne znače
 * bez vizualnog opažanja.
 *
 * `<div>`, ne `<main>` — dok je fallback prikazan, stvarna stranica (koja
 * ima svoj `<main>`) još nije uklonjena iz stabla, pa bi dva `<main>`
 * landmarka istovremeno postojala. U ovoj verziji Next.js/Turbopack dev
 * servera to dodatno sprječava zamjenu fallbacka stvarnim sadržajem kad
 * streaming završi (potvrđeno uživo — stranica ostane zaglavljena na
 * fallbacku), pa je `<div>` ovdje ispravno i po pristupačnosti i po
 * ponašanju.
 */
export function EventsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12 sm:py-20">
      <span className="sr-only" role="status">
        Učitavanje događanja…
      </span>

      <div aria-hidden="true" className="animate-pulse">
        <div className="mb-10">
          <div className="bg-line h-3 w-40 rounded" />
          <div className="bg-line mt-3 h-10 w-64 max-w-full rounded" />
          <div className="bg-line mt-3 h-4 w-32 rounded" />
        </div>

        <div className="border-line mb-8 h-16 rounded-md border" />

        <ul>
          {[0, 1, 2, 3].map((i) => (
            <li
              key={i}
              className="border-line flex items-center gap-4 border-b py-4 last:border-b-0"
            >
              <div className="bg-line h-8 w-16 shrink-0 rounded" />
              <div className="min-w-0 flex-1">
                <div className="bg-line h-5 w-3/4 rounded" />
                <div className="bg-line mt-2 h-3 w-1/2 rounded" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
