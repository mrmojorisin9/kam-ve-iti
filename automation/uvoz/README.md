# Sandučić za lokalne JSONL datoteke

Ubaci ovdje `.jsonl` datoteku s događajima. Dnevni n8n cron (čvor
"Pokreni scraper (uvoz)") obradi sve `.jsonl` datoteke iz ove mape kroz
isti postupak kao web izvore (Claude ekstrakcija, provjera duplikata, novi
događaji idu na čekanje u `/admin/dogadjaji`).

- **Nakon uspješne obrade** datoteka se premjesti u `obradjeno\` (s datumom
  i vremenom ispred naziva) — ne obrađuje se ponovno.
- **Ako je datoteka neispravna** (loš JSON, nedostaje obavezno polje),
  ostaje ovdje, a u izlazu (OUTPUT) čvora "Pokreni scraper (uvoz)" u n8n
  piše `"error"` s brojem retka — ostale datoteke se normalno obrade.
  Ispravi i pričekaj sljedeći run.
- **Ako je obrada prekinuta** sigurnosnim stropom od 100 Claude poziva,
  datoteka ostaje ovdje i sljedeći dan se nastavlja (već upisani redci se
  preskaču).

Format datoteke (polja, primjer): `automation/README.md`, odjeljak
"Lokalna JSONL datoteka". Ručno odmah, bez čekanja crona: u n8n otvori
workflow i pokreni samo taj čvor, ili `pokreni-scraper.bat` → opcija 6.

Sadržaj ove mape (osim ovog README-a) se ne sprema u git.
