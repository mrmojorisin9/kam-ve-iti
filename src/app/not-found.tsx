import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center px-6 py-12 sm:py-20">
      <p className="text-parchment-muted font-mono text-xs tracking-[0.2em] uppercase">
        404
      </p>
      <h1 className="font-display text-parchment mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Stranica nije pronađena
      </h1>
      <p className="text-parchment-muted mt-3">
        Događaj ili stranica koju tražiš ne postoji ili je uklonjena.
      </p>

      <Link
        href="/"
        className="border-gold text-gold hover:bg-gold hover:text-night focus-visible:outline-gold mt-8 rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Natrag na naslovnicu
      </Link>
    </main>
  );
}
