import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Prijava zaprimljena — Kam denes",
};

export default function ProposeEventThankYouPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start px-6 py-12">
      <h1 className="font-display text-parchment text-3xl font-semibold tracking-tight">
        Hvala na prijavi!
      </h1>
      <p className="text-parchment-muted mt-3 text-sm">
        Tvoj prijedlog događaja je zaprimljen i čeka pregled administratora.
        Nakon odobrenja postat će vidljiv na portalu.
      </p>

      <Link
        href="/"
        className="border-gold text-gold hover:bg-gold hover:text-night focus-visible:outline-gold mt-6 rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Natrag na naslovnu
      </Link>
    </main>
  );
}
