/**
 * Kratka pravna napomena (korisnikov zahtjev) — disclaimer o izvoru i
 * točnosti prenesenih sadržaja, ne tvrdnja o vlastitim autorskim pravima
 * nad njima. Čist statičan tekst, nema potrebe za "use client" niti
 * sakrivanjem na /admin (bezopasno svugdje).
 */
export function Footer() {
  return (
    <footer className="border-line text-parchment-muted mt-auto border-t px-6 py-6 text-center text-xs">
      <p>
        © {new Date().getFullYear()} Kam denes. Informacije na portalu
        prenose iz izvora lokalnih portala i drugih javnih objava. Autorska
        prava ostaju kod izvornih vlasnika. Ne jamčimo točnost niti snosimo
        odgovornost za greške u prenesenim sadržajima. Provjerite originalne
        izvore. Sadržaj je informativne prirode.
      </p>
    </footer>
  );
}
