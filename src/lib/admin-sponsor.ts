import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAbsoluteUrl } from "@/lib/admin-events";

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

/** Jedini konfiguracijski redak (`id = 1`) — vidi 0033_general_sponsor.sql. */
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

// Isti sigurnosni obrazac kao uploadImageFile u admin-events.ts (audit
// nalaz #5, 2026-07-21): ekstenzija/contentType izvedeni ISKLJUČIVO iz
// server-verificiranog file.type protiv allowlista, nikad iz file.name —
// bucket je javan. Namjerno mala duplikacija umjesto refaktora
// admin-events.ts (nema drugog pozivatelja koji bi opravdao dijeljenje).
const ALLOWED_LOGO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function uploadSponsorLogo(
  supabase: SupabaseClient,
  file: File,
): Promise<string> {
  const ext = ALLOWED_LOGO_TYPES[file.type];
  if (!ext) {
    throw new Error("Logotip mora biti JPG, PNG ili WebP.");
  }
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("sponsor-assets")
    .upload(path, file, { contentType: file.type });

  if (error) {
    throw new Error(`Logotip: ${error.message}`);
  }

  return supabase.storage.from("sponsor-assets").getPublicUrl(path).data
    .publicUrl;
}

function readText(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value || null;
}

/**
 * Validacija + upis admin forme za `/admin/sponzor`. Ako je is_active
 * uključen, naziv/logo/poveznica moraju biti popunjeni — sprječava
 * "upaljen" sponzor bez sadržaja koji bi front-end (Faza 2) inače tiho
 * prikazao prazan/polovičan widget.
 */
export async function updateGeneralSponsor(
  supabase: SupabaseClient,
  formData: FormData,
): Promise<{ error: string | null }> {
  const isActive = formData.get("is_active") === "on";
  const sponsorName = readText(formData, "sponsor_name");
  const promoText = readText(formData, "promo_text");
  const linkUrl = readText(formData, "link_url");
  const logoFile = formData.get("logo_file");
  const hasLogoFile = logoFile instanceof File && logoFile.size > 0;

  const displayFrequencyRaw = readText(formData, "display_frequency");
  const validFrequencies = DISPLAY_FREQUENCY_OPTIONS.map((o) => o.value);
  const displayFrequency = validFrequencies.includes(
    displayFrequencyRaw as DisplayFrequency,
  )
    ? (displayFrequencyRaw as DisplayFrequency)
    : "once_per_day";

  if (linkUrl && !isAbsoluteUrl(linkUrl)) {
    return {
      error:
        "Poveznica mora biti puna adresa koja počinje s http:// ili https://.",
    };
  }

  const { data: existing } = await supabase
    .from("general_sponsor")
    .select("logo_url")
    .eq("id", 1)
    .maybeSingle();

  let logoUrl = (existing as { logo_url: string | null } | null)?.logo_url ?? null;
  if (hasLogoFile) {
    try {
      logoUrl = await uploadSponsorLogo(supabase, logoFile);
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  if (isActive && (!sponsorName || !logoUrl || !linkUrl)) {
    return {
      error: "Za aktivnog sponzora su obavezni naziv, logotip i poveznica.",
    };
  }

  const { error } = await supabase
    .from("general_sponsor")
    .update({
      is_active: isActive,
      sponsor_name: sponsorName,
      logo_url: logoUrl,
      promo_text: promoText,
      link_url: linkUrl,
      display_frequency: displayFrequency,
    })
    .eq("id", 1);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
