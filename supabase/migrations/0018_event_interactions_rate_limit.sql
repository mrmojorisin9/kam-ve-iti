-- Kam denes — sigurnosni audit 2026-07-21, nalaz #2 (CONFIRMED): anon INSERT
-- na event_interactions je potpuno otvoren ("with check (true)", 0009), bez
-- ikakvog ograničenja. Skripta koja šalje ponavljane insertove na isti
-- event_id može umjetno naduvati popularity_score i 🔥/📈 oznake (ADR-014)
-- te poziciju u "U trendu" panelu na naslovnoj, zaobilazeći namjeru da te
-- oznake odražavaju stvaran interes posjetitelja.
--
-- Trigger ograničava insertove PO EVENTU (ne po posjetitelju — nema
-- identifikacije, namjerno, ADR-014), na 20 upisa unutar 60 sekundi po
-- jednom event_id (korisnikova odluka, sigurnosni audit 2026-07-21). Ne
-- sprječava distribuirani spam preko više događaja odjednom, ali brani
-- protiv naduvavanja jednog konkretnog eventa preko realnog broja pregleda
-- malog regionalnog portala. Kompozitni indeks (event_id, created_at) čini
-- brojanje u triggeru jeftinim (koristi ga i sam trigger na svaki insert).

create index if not exists event_interactions_event_id_created_at_idx
  on event_interactions (event_id, created_at);

create or replace function enforce_event_interaction_rate_limit()
returns trigger
language plpgsql
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from event_interactions
  where event_id = new.event_id
    and created_at >= now() - interval '60 seconds';

  if recent_count >= 20 then
    raise exception 'event_interactions rate limit exceeded for this event'
      using errcode = '42901';
  end if;

  return new;
end;
$$;

drop trigger if exists event_interactions_rate_limit on event_interactions;

create trigger event_interactions_rate_limit
  before insert on event_interactions
  for each row
  execute function enforce_event_interaction_rate_limit();
