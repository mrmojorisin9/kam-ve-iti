import { createClient } from "@/lib/supabase/server";

export type DisplayFrequency = "once_per_day" | "three_per_day" | "every_session";

export const DISPLAY_FREQUENCY_OPTIONS: { value: DisplayFrequency; label: string }[] = [
  { value: "once_per_day", label: "1 prikaz unutar 24 sata" },
  { value: "three_per_day", label: "3 prikaza unutar 24 sata" },
  { value: "every_session", label: "Svaka nova sesija (svako otvaranje stranice)" },
];

export type GeneralSponsor = {
  isActive: boolean;
  sponsorName: string | null;
  logoUrl: string | null;
  promoText: string | null;
  linkUrl: string | null;
  displayFrequency: DisplayFrequency;
};

type GeneralSponsorRow = {
  is_active: boolean;
  sponsor_name: string | null;
  logo_url: string | null;
  promo_text: string | null;
  link_url: string | null;
  display_frequency: DisplayFrequency;
};

function mapRow(row: GeneralSponsorRow): GeneralSponsor {
  return {
    isActive: row.is_active,
    sponsorName: row.sponsor_name,
    logoUrl: row.logo_url,
    promoText: row.promo_text,
    linkUrl: row.link_url,
    displayFrequency: row.display_frequency,
  };
}

/**
 * Jedini konfiguracijski redak (`id = 1`) — vidi 0033_general_sponsor.sql.
 * Javno čitanje (RLS `general_sponsor_public_read`), poziva ga i admin
 * forma i root layout (`src/app/layout.tsx`) na svakom javnom requestu.
 */
export async function getGeneralSponsor(): Promise<GeneralSponsor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("general_sponsor")
    .select(
      "is_active, sponsor_name, logo_url, promo_text, link_url, display_frequency",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getGeneralSponsor:", error.message);
    return null;
  }

  return mapRow(data as GeneralSponsorRow);
}
