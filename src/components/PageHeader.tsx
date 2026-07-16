export function PageHeader({ subtitle }: { subtitle: string }) {
  return (
    <header className="mb-10">
      <p className="text-parchment-muted font-mono text-xs tracking-[0.2em] uppercase">
        Međimurska županija
      </p>
      <h1 className="font-display text-parchment mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
        Kam denes
      </h1>
      <p className="text-gold mt-3 font-mono text-sm capitalize">
        {subtitle}
      </p>
    </header>
  );
}