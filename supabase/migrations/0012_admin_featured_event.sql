-- Kam denes — administrator može ručno istaknuti jedan "TOP događaj"
-- koji ima prednost nad algoritamskim popularity score (ADR-014) u
-- panelu "U trendu" na naslovnoj. Samo jedan aktivan u svakom trenutku —
-- provodi se u aplikacijskom sloju (Server Action prvo čisti flag na
-- svim ostalim događajima), ne DB constraintom, u duhu ADR-006
-- (jednostavnije, dovoljno za jednog kuratora bez konkurentnih pisanja).

alter table events
  add column is_admin_featured boolean not null default false;
