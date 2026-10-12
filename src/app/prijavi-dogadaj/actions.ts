"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { sendSubmissionNotice } from "@/lib/notify";
import { verifyCaptcha } from "@/lib/captcha";
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

export async function submitEvent(formData: FormData) {
  const title = readText(formData, "title");
  const categoryId = readText(formData, "category_id");
  const locationId = readText(formData, "location_id");
  const startAtLocal = readText(formData, "start_at");
  const endAtLocal = readText(formData, "end_at");
  const submitterEmail = readText(formData, "submitter_email");

  // Honeypot popunjen = bot. Tiho "uspjeh" bez upisa — bot ne dobiva
  // signal da je otkriven (pa ne prilagođava pokušaj).
  if (readText(formData, "website")) {
    redirect("/prijavi-dogadaj/hvala");
  }

  const captcha = verifyCaptcha(
    String(formData.get("captcha_token") ?? ""),
    String(formData.get("captcha_answer") ?? ""),
  );
  if (captcha === "wrong") {
    fail("Pogrešan odgovor na računsko pitanje, pokušaj ponovno.");
  }
  if (captcha === "too_fast") {
    fail("Obrazac je poslan prebrzo — pričekaj trenutak i pokušaj ponovno.");
  }
  if (captcha !== "ok") {
    fail("Obrazac je istekao, ispuni ga ponovno.");
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

  // Link na događaj (FB event, stranica organizatora) — zamjena za ukinutu
  // zasebnu "prijavu linkom" (korisnikov zahtjev, 2026-10-12). Sprema se u
  // source_url, koji stranica događaja već prikazuje kao "Izvor / više
  // informacija".
  const eventUrl = readText(formData, "event_url");
  if (eventUrl && !isAbsoluteUrl(eventUrl)) {
    fail("Link na događaj mora biti puna adresa koja počinje s http:// ili https://.");
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

  let row = {
    title,
    description: readText(formData, "description"),
    category_id: categoryId,
    location_id: locationId,
    venue_name: readText(formData, "venue_name"),
    start_at: startAt,
    end_at: endAt,
    image_url: readText(formData, "image_url"),
    source_url: eventUrl,
    status: "pending_review" as const,
    submitter_email: submitterEmail,
    submitter_phone: readText(formData, "submitter_phone"),
  };
  let rowSlug = slug;

  // 23505 = unique sudar: slug (rijedak sudar s tuđim neobjavljenim
  // prijedlogom, vidi gore) ILI source_url (events_source_url_unique, 0024 —
  // isti link već postoji, npr. scraper ili druga prijava istog FB eventa).
  // Kod linka se prijedlog ipak sprema, a link seli u opis da se ne izgubi.
  // Najviše dva ponovna pokušaja (link pa slug, ili obrnuto).
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase
      .from("events")
      .insert({ ...row, slug: rowSlug });

    if (!error) {
      // Mail adminu nakon odgovora (after) — prijavitelj ne čeka slanje, a
      // neuspjeh slanja ne može poništiti već spremljenu prijavu.
      const notice = row;
      after(() =>
        sendSubmissionNotice({
          title: notice.title,
          categoryId: notice.category_id,
          locationId: notice.location_id,
          venueName: notice.venue_name,
          startAt: notice.start_at,
          endAt: notice.end_at,
          description: notice.description,
          // Kod source_url sudara link je već u opisu (vidi niže).
          eventUrl: notice.source_url,
          submitterEmail: notice.submitter_email,
          submitterPhone: notice.submitter_phone,
        }),
      );
      redirect("/prijavi-dogadaj/hvala");
    }
    if (error.code !== "23505" || attempt === 2) {
      fail("Prijedlog nije spremljen, pokušaj ponovno.");
    }

    if (error.message.includes("source_url") && row.source_url) {
      const linkNote = `Link: ${row.source_url}`;
      row = {
        ...row,
        source_url: null,
        description: row.description
          ? `${row.description}\n\n${linkNote}`
          : linkNote,
      };
    } else {
      rowSlug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }
  }
}
