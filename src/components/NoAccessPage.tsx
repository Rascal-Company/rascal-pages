import { Clock, ShieldX } from "lucide-react";
import { AccountMenu } from "@/app/components/AccountMenu";

/**
 * Näkymä, kun organisaatiolla ei ole Rascal Pages -tuotetta (tai kokeilu on
 * päättynyt). Tilivalikosta voi vaihtaa tuotetta tai kirjautua ulos.
 */
export function NoAccessPage({ trialExpired }: { trialExpired: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex justify-end p-4">
        <AccountMenu />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
          <span
            className={
              trialExpired
                ? "mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-amber-500/12 text-amber-600"
                : "mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive"
            }
          >
            {trialExpired ? <Clock className="size-8" aria-hidden /> : <ShieldX className="size-8" aria-hidden />}
          </span>
          <h1 className="mb-3 text-2xl font-bold tracking-tight">
            {trialExpired ? "Kokeilujakso päättynyt" : "Ei käyttöoikeutta"}
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
            {trialExpired
              ? "Rascal Pages -kokeilujaksosi on päättynyt. Päivitä tilauksesi jatkaaksesi palvelun käyttöä."
              : "Organisaatiollasi ei ole pääsyä Rascal Pages -tuotteeseen. Ota yhteyttä myyntiin aktivoidaksesi tuotteen."}
          </p>
          <div className="flex flex-col items-center gap-3">
            <a
              href="https://www.rascal.fi/hinnat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              {trialExpired ? "Päivitä tilaus" : "Katso hinnat"}
            </a>
            <a
              href="mailto:info@rascal.fi"
              className="inline-flex h-10 items-center rounded-lg px-6 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Ota yhteyttä
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
