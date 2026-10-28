/**
 * Lukittu "Vie kontaktit CRM:ään" -kytkin organisaatioille ilman Rascal CRM:ää
 * (RAS-1172): näyttää mitä CRM:llä saisi, kokeilukehotteen kera.
 */
export default function CrmUpsell() {
  return (
    <div className="space-y-2 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">🔒 Vie kontaktit CRM:ään</span>
        <span
          aria-hidden
          className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent bg-muted opacity-60"
        >
          <span className="inline-block h-5 w-5 rounded-full bg-white shadow" />
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Rascal CRM:n kanssa liidit tallentuvat suoraan myyntiin valitsemallasi tagilla, ja CRM:n
        automaatiot käynnistyvät.{" "}
        <a
          href="https://www.rascal.fi"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline underline-offset-2"
        >
          Kokeile Rascal CRM:ää
        </a>
      </p>
    </div>
  );
}
