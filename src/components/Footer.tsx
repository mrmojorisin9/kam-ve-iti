/**
 * Kratka autorska napomena (korisnikov zahtjev, pravna a ne tehnička
 * zaštita sadržaja — autorsko pravo u EU/HR postoji automatski, ovo
 * samo daje jasnu osnovu). Čist statičan tekst, nema potrebe za
 * "use client" niti sakrivanjem na /admin (bezopasno svugdje).
 */
export function Footer() {
  return (
    <footer className="border-line text-parchment-muted mt-auto border-t px-6 py-6 text-center text-xs">
      <p>
        © {new Date().getFullYear()} Kam denes. Sadržaj (tekstovi, opisi
        događaja) je autorski zaštićen — preuzimanje i reprodukcija bez
        dopuštenja nisu dopušteni.
      </p>
    </footer>
  );
}
