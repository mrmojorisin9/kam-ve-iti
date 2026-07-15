import type { Metadata } from "next";
import { login } from "./actions";

export const metadata: Metadata = {
  title: "Prijava administratora — Kam ve iti",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <p className="text-parchment-muted font-mono text-xs tracking-[0.2em] uppercase">
        Kam ve iti
      </p>
      <h1 className="font-display text-parchment mt-2 text-3xl font-semibold tracking-tight">
        Prijava administratora
      </h1>

      <form action={login} className="mt-8 flex flex-col gap-4">
        <label className="text-sm">
          <span className="text-parchment-muted mb-1 block">E-mail</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="border-line bg-oak text-parchment w-full rounded-md border px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm">
          <span className="text-parchment-muted mb-1 block">Lozinka</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="border-line bg-oak text-parchment w-full rounded-md border px-3 py-2 text-sm"
          />
        </label>

        {error && (
          <p className="text-wine text-sm" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="border-gold text-gold hover:bg-gold hover:text-night focus-visible:outline-gold mt-2 rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Prijava
        </button>
      </form>
    </main>
  );
}
