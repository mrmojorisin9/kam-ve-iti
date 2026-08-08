"use client";

export type MergeCandidateSummary = {
  id: string;
  title: string;
  values: Record<string, string | boolean>;
};

/**
 * Po jedan gumb po kandidatu koji odjednom popuni sva polja `EventForm`-a
 * njegovim vrijednostima — obična DOM manipulacija po `name` atributu, ne
 * React state, jer polja u `EventForm` ostaju obični uncontrolled inputi.
 */
export function MergeQuickFillButtons({
  candidates,
}: {
  candidates: MergeCandidateSummary[];
}) {
  function applyCandidate(candidate: MergeCandidateSummary) {
    for (const [name, value] of Object.entries(candidate.values)) {
      const el = document.querySelector<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >(`[name="${name}"]`);
      if (!el) continue;

      if (el instanceof HTMLInputElement && el.type === "checkbox") {
        el.checked = Boolean(value);
      } else {
        el.value = String(value ?? "");
      }
    }
  }

  return (
    <fieldset className="border-line rounded-md border p-4">
      <legend className="text-parchment-muted px-1 text-sm">
        Brzo popuni polja iz jednog izvora
      </legend>
      <div className="flex flex-wrap gap-2">
        {candidates.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            onClick={() => applyCandidate(candidate)}
            className="border-line text-parchment-muted hover:text-parchment rounded-md border px-3 py-1.5 text-xs"
          >
            Preuzmi sve iz: {candidate.title}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
