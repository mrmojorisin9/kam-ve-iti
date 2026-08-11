"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { zagrebLocalToUtcIso } from "@/lib/zagreb-time";
import { uniqueSlug, isAbsoluteUrl } from "@/lib/admin-events";

function readText(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value || null;
}

function fail(message: string): never {
  redirect(`/prijavi-dogadaj?error=${encodeURIComponent(message)}`);
}

function failLink(message: string): never {
  redirect(`/prijavi-dogadaj?linkError=${encodeURIComponent(message)}`);
}

export async function submitEvent(formData: FormData) {
  const title = readText(formData, "title");
  const categoryId = readText(formData, "category_id");
  const locationId = readText(formData, "location_id");
  const startAtLocal = readText(formData, "start_at");
  const endAtLocal = readText(formData, "end_at");
  const submitterEmail = readText(formData, "submitter_email");

  const captchaA = Number(formData.get("captcha_a"));
  const captchaB = Number(formData.get("captcha_b"));
  const captchaAnswer = Number(formData.get("captcha_answer"));

  if (captchaAnswer !== captchaA + captchaB) {
    fail("Pogrešan odgovor na računsko pitanje, pokušaj ponovno.");
  }

  if (!title || !categoryId || !locationId || !startAtLocal || !submitterEmail) {
    fail("Naziv, kategorija, lokacija, početak i e-mail su obavezni.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) {
    fail("Unesi ispravnu e-mail adresu.");
  }

  const startAt = zagrebLocalToUtcIso(startAtLocal);
  const endAt = endAtLocal ? zagrebLocalToUtcIso(endAtLocal) : null;

  if (endAt && endAt < startAt) {
    fail("Kraj događaja ne može biti prije početka.");
  }

  // Bez prijave (anon) — koristi se isti klijent kao svugdje, ali ovaj upis
  // prolazi kroz "events_public_submit" RLS politiku (0014), ne
  // "events_admin_full_access". status/is_admin_featured/created_by se
  // namjerno ne čitaju iz formData — forsirani su ovdje bez obzira na to
  // što bi klijent eventualno poslao (RLS WITH CHECK je krajnja obrana,
  // ali forma ionako ne smije ni pokušati poslati nešto drugo).
  const supabase = await createClient();

  const baseSlug = slugify(title);
  if (!baseSlug) {
    fail("Naziv mora sadržavati barem jedno slovo ili broj.");
  }

  // uniqueSlug ovdje vidi samo objavljene slugove (anon RLS na events
  // dopušta SELECT samo za status='published') — najbolji mogući
  // pokušaj izbjegavanja sudara unaprijed. Stvarna zaštita je `slug`
  // UNIQUE constraint u bazi; na rijedak stvaran sudar (npr. s tuđim
  // pending_review prijedlogom istog naslova) odgovara se jednim
  // ponovnim pokušajem s nasumičnim sufiksom.
  const slug = await uniqueSlug(supabase, baseSlug);

  const row = {
    title,
    description: readText(formData, "description"),
    category_id: categoryId,
    location_id: locationId,
    venue_name: readText(formData, "venue_name"),
    start_at: startAt,
    end_at: endAt,
    image_url: readText(formData, "image_url"),
    status: "pending_review" as const,
    submitter_email: submitterEmail,
    submitter_phone: readText(formData, "submitter_phone"),
  };

  const { error } = await supabase.from("events").insert({ ...row, slug });

  if (error?.code === "23505") {
    const retrySlug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    const retry = await supabase.from("events").insert({ ...row, slug: retrySlug });
    if (retry.error) {
      fail("Prijedlog nije spremljen, pokušaj ponovno.");
    }
  } else if (error) {
    fail("Prijedlog nije spremljen, pokušaj ponovno.");
  }

  redirect("/prijavi-dogadaj/hvala");
}

/**
 * "Imaš događaj? Pošalji nam link" — brz put pored pune ručne forme
 * (korisnikov zahtjev). Namjerno NE ide u `events` (vidi
 * 0036_event_link_submissions.sql za obrazloženje) — sprema se u
 * jednostavan inbox koji admin ručno prazni preko `/admin/dogadjaji/novi`
 * (`/admin/dogadjaji?status=prijave-linkom`).
 */
export async function submitEventLink(formData: FormData) {
  const url = readText(formData, "link_url");
  const captchaA = Number(formData.get("link_captcha_a"));
  const captchaB = Number(formData.get("link_captcha_b"));
  const captchaAnswer = Number(formData.get("link_captcha_answer"));

  if (captchaAnswer !== captchaA + captchaB) {
    failLink("Pogrešan odgovor na računsko pitanje, pokušaj ponovno.");
  }

  if (!url) {
    failLink("Link je obavezan.");
  }

  if (!isAbsoluteUrl(url)) {
    failLink("Link mora biti puna adresa koja počinje s http:// ili https://.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("event_link_submissions").insert({
    url,
    note: readText(formData, "link_note"),
    submitter_email: readText(formData, "link_submitter_email"),
    submitter_phone: readText(formData, "link_submitter_phone"),
  });

  if (error) {
    failLink("Link nije spremljen, pokušaj ponovno.");
  }

  redirect("/prijavi-dogadaj?linkSaved=1");
}
