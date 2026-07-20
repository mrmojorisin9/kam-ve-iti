const MESSAGES: Record<"tags" | "region", string> = {
  tags: "Nema događaja koji odgovaraju svim odabranim pametnim filtrima. Prikazani su rezultati bez njih:",
  region:
    "Nema događaja u odabranoj regiji. Prikazani su rezultati iz cijelog Međimurja:",
};

export function FallbackNotice({
  relaxedFrom,
}: {
  relaxedFrom: "tags" | "region";
}) {
  return (
    <p className="border-gold/40 bg-gold/10 text-parchment mb-4 rounded-md border px-4 py-3 text-sm">
      {MESSAGES[relaxedFrom]}
    </p>
  );
}
