-- Kam denes — sigurnosni audit 2026-07-21, nalaz #2 (nastavak): javni obrazac
-- "Prijavi dogadaj" (ADR-016) ima samo trivijalno zaobredivu captchu (zbroj
-- dva broja u hidden inputima, vidljiva u HTML izvoru, bez isteka/potpisa) i
-- NIKAKAV rate limit na sam insert. Za razliku od event_interactions (0018),
-- ovdje svaka prijava stvara NOVI red u events (nema zajednickog event_id
-- na koji bi se vezao per-row trigger), pa je ovo GLOBALNI prag preko svih
-- anon prijava zajedno — nema identifikacije posjetitelja (isti duh kao
-- ADR-014), pa se ne moze ograniciti "po posjetitelju".
--
-- Prag (korisnikova odluka, sigurnosni audit 2026-07-21): 5 prijava / 10
-- minuta, GLOBALNO. Trigger prepoznaje "javnu prijavu" po istom obrascu koji
-- vec zahtijeva RLS WITH CHECK politika events_public_submit (0014): status
-- = 'pending_review' AND created_by IS NULL — admin rucno postavljen
-- "Na cekanju" status uvijek ima created_by postavljen (autenticiran
-- korisnik), pa se ne racuna u ovaj prag.
--
-- SECURITY DEFINER OD POCETKA (nauceno iz 0018→0019 greske istog dana):
-- anon nema NIKAKVU SELECT politiku na events za status != 'published'
-- (samo events_public_read_published), pa bi obican (SECURITY INVOKER)
-- trigger vidio 0 postojecih pending_review redaka kroz RLS bez obzira
-- koliko ih stvarno postoji — limit se nikad ne bi mogao dosegnuti, isti
-- RLS-blind bug kao proslo popravljeni. Ovdje je ispravno postavljeno
-- odmah, ne otkriveno naknadno live testom.

create index if not exists events_public_submission_rate_limit_idx
  on events (status, created_by, created_at)
  where created_by is null;

create or replace function enforce_public_submission_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  if new.status = 'pending_review' and new.created_by is null then
    select count(*) into recent_count
    from events
    where status = 'pending_review'
      and created_by is null
      and created_at >= now() - interval '10 minutes';

    if recent_count >= 5 then
      raise exception 'public event submission rate limit exceeded'
        using errcode = '42901';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists events_public_submission_rate_limit on events;

create trigger events_public_submission_rate_limit
  before insert on events
  for each row
  execute function enforce_public_submission_rate_limit();
