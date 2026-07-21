-- Kam denes — javni obrazac "Prijavi događaj" (Faza 8, Dan 44).
-- Primijeniti kroz Supabase Dashboard SQL Editor.
-- Vidi DECISIONS.md ADR-016.

alter table events
  add column submitter_email text,
  add column submitter_phone text;

comment on column events.submitter_email is
  'Kontakt e-mail prijavitelja iz javnog obrasca "Prijavi događaj". NULL za događaje unesene kroz admin formu/CSV.';
comment on column events.submitter_phone is
  'Kontakt telefon prijavitelja (opcionalan) iz javnog obrasca "Prijavi događaj". NULL za administratorski unos.';

-- ---------------------------------------------------------------------
-- RLS: dopusti anon (bilo koji posjetitelj, bez registracije) INSERT,
-- ali WITH CHECK sam po sebi mora spriječiti zaobilaženje javne forme —
-- Supabase REST API je izravno dostupan svakome s anon (publishable)
-- ključem, Next.js forma i Server Action nisu jedini put upisa.
-- ---------------------------------------------------------------------
create policy "events_public_submit" on events
  for insert to anon
  with check (
    status = 'pending_review'
    and is_admin_featured = false
    and created_by is null
  );

-- ---------------------------------------------------------------------
-- Column-level zaštita: submitter_email/submitter_phone ne smiju biti
-- čitljivi anon korisnicima izravnim upitom na te kolone preko API-ja —
-- ni nakon što admin odobri događaj (status -> published), jer je
-- postojeća "events_public_read_published" politika row-level, ne
-- column-level. Bez ovoga bi kontakt prijavitelja postao javno čitljiv
-- čim događaj postane objavljen.
-- ---------------------------------------------------------------------
revoke select (submitter_email, submitter_phone) on events from anon;
