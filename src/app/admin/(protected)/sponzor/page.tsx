import type { Metadata } from "next";
import { DISPLAY_FREQUENCY_OPTIONS, getGeneralSponsor } from "@/lib/admin-sponsor";
import { saveSponsor } from "./actions";

export const metadata: Metadata = {
  title: "Generalni sponzor — Kam denes admin",
};

const inputClass =
  "border-line bg-oak text-parchment w-full rounded-md border px-3 py-2 text-sm";
const labelClass = "text-parchment-muted mb-1 block";

export default async function SponsorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const sponsor = await getGeneralSponsor();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
      <h1 className="font-display text-parchment text-3xl font-semibold tracking-tight">
        Generalni sponzor
      </h1>
      <p className="text-parchment-muted mt-2 text-sm">
        Postavke animirane reklame koja se prikazuje na javnom portalu
        (splash pri prvom posjetu → trajni widget u kutu). Promjene su
        vidljive svim korisnicima odmah nakon spremanja, bez redeploya.
      </p>

      {saved && (
        <p className="border-gold text-gold mt-6 rounded-md border px-4 py-3 text-sm">
          Spremljeno.
        </p>
      )}

      <form action={saveSponsor} className="mt-8 flex flex-col gap-4">
        <label className="text-parchment flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={sponsor?.isActive}
          />
          Reklama je aktivna (prikazuje se na portalu)
        </label>
        <p className="text-parchment-muted -mt-2 text-xs">
          Uključi tek kad su naziv, logotip i poveznica popunjeni — ne može
          se spremiti aktivna reklama bez sadržaja.
        </p>

        <label className="text-sm">
          <span className={labelClass}>Naziv sponzora</span>
          <input
            type="text"
            name="sponsor_name"
            defaultValue={sponsor?.sponsorName ?? ""}
            className={inputClass}
          />
        </label>

        <div className="text-sm">
          <span className={labelClass}>Logotip (JPG, PNG ili WebP)</span>

          {sponsor?.logoUrl && (
            <img
              src={sponsor.logoUrl}
              alt=""
              className="border-line mb-2 h-20 w-20 rounded-md border object-contain bg-white p-1"
            />
          )}

          <input
            type="file"
            name="logo_file"
            accept="image/jpeg,image/png,image/webp"
            className={inputClass}
          />

          <span className="text-parchment-muted mt-1 block text-xs">
            Ostavi prazno da zadržiš postojeći logotip.
          </span>
        </div>

        <label className="text-sm">
          <span className={labelClass}>Promotivni tekst</span>
          <textarea
            name="promo_text"
            rows={4}
            defaultValue={sponsor?.promoText ?? ""}
            className={inputClass}
          />
        </label>

        <label className="text-sm">
          <span className={labelClass}>Poveznica (klik u pop-up dijalogu)</span>
          <input
            type="url"
            name="link_url"
            placeholder="https://..."
            defaultValue={sponsor?.linkUrl ?? ""}
            className={inputClass}
          />
        </label>

        <label className="text-sm">
          <span className={labelClass}>Učestalost prikaza</span>
          <select
            name="display_frequency"
            defaultValue={sponsor?.displayFrequency ?? "once_per_day"}
            className={inputClass}
          >
            {DISPLAY_FREQUENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-parchment-muted -mt-2 text-xs">
          Koliko često se full-screen animacija smije prikazati istom
          korisniku. &quot;Svaka nova sesija&quot; isključuje 24h
          ograničenje — animacija se prikazuje pri svakom otvaranju
          stranice.
        </p>

        {error && (
          <p className="text-wine-light text-sm" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="border-gold text-gold hover:bg-gold hover:text-night focus-visible:outline-gold mt-2 self-start rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Spremi promjene
        </button>
      </form>
    </main>
  );
}
