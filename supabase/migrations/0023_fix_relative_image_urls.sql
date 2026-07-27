-- Kam denes — jednokratno čišćenje podataka (Faza 8, Dan 77).
--
-- Otkriveno Dan 75 (Schema.org rad) i Dan 76 (admin forma se tiho ne sprema):
-- barem dva događaja u bazi imaju image_url postavljen izravno na relativnu
-- putanju ("/event-placeholder.svg") umjesto na null ili pravi apsolutni
-- URL. Relativna putanja je nerazrješiva za Google (Schema.org image mora
-- biti apsolutan) i HTML5 `type="url"` polje na admin formi je tiho odbija
-- (bez ikakve poruke greške) — vidi novu isAbsoluteUrl() provjeru u
-- admin-events.ts koja od sad sprječava da se ovo ponovi.
--
-- Postavlja na null; postojeći `?? "/event-placeholder.svg"` kodni fallback
-- (dogadjaji/[slug]/page.tsx, EventRow.tsx) preuzima prikaz kao i za bilo
-- koji drugi događaj bez fotografije.

update events
set image_url = null
where image_url is not null
  and image_url !~ '^https?://';
