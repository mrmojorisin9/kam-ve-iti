export function EmptyState() {
  return (
    <div className="border-line border-t py-16 text-center">
      <p className="font-display text-parchment text-2xl">
        Nema najavljenih događanja
      </p>
      <p className="text-parchment-muted mt-2">
        Pokušaj promijeniti filtre ili pogledati drugi termin.
      </p>
    </div>
  );
}