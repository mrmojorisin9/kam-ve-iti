export function EmptyState({
  title = "Nema najavljenih događanja",
  message = "Pokušaj promijeniti filtre ili pogledati drugi termin.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="border-line border-t py-16 text-center">
      <p className="font-display text-parchment text-2xl">{title}</p>
      <p className="text-parchment-muted mt-2">{message}</p>
    </div>
  );
}
