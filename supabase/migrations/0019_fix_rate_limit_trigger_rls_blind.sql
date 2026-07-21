-- Kam denes — sigurnosni audit 2026-07-21, ispravak istog dana (isti obrazac
-- kao 0014→0015): 0018 je uveo enforce_event_interaction_rate_limit() kao
-- običnu (SECURITY INVOKER) plpgsql funkciju. Live test je pokazao da radi
-- ispravno pozvana kao service-role (blokira nakon 20 insertova unutar 60s),
-- ali NE i pozvana kao anon — sve 25 anon insertova je prošlo.
--
-- Uzrok: trigger funkcija se izvršava s privilegijama pozivatelja (anon), a
-- anon nema SELECT politiku na event_interactions uopće (samo INSERT,
-- namjerno, ADR-014/0009). Trigger-ov vlastiti "select count(*) from
-- event_interactions ..." je RLS-om vraćao 0 redaka za anon pozivatelja bez
-- obzira koliko je redaka stvarno u tablici — limit se nikad nije mogao
-- dosegnuti. Isti obrazac kao već poznata column-level REVOKE zamka: kod je
-- na papiru izgledao ispravno, RLS interakcija ga je tiho poništila.
--
-- Ispravak: SECURITY DEFINER (isti obrazac kao event_popularity_score/
-- event_is_trending/event_view_count, 0010/0011/0013) — trigger sad broji
-- retke s privilegijama vlasnika funkcije, zaobilazeći RLS SELECT
-- restrikciju samo za svrhu brojanja, ne izlažući retke pozivatelju.

create or replace function enforce_event_interaction_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
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
