import NewSiteForm from "./NewSiteForm";
import NewOverlaySiteForm from "./NewOverlaySiteForm";
import NewReferenceSiteForm from "./NewReferenceSiteForm";

interface PageProps {
  searchParams: Promise<{ mode?: string }>;
}

/** Uusi sivusto: ?mode=blank (tyhjä sivu), ?mode=overlay (asiakkaan sivu) tai ?mode=reference (referensseistä). */
export default async function NewSitePage({ searchParams }: PageProps) {
  const { mode } = await searchParams;
  if (mode === "overlay") return <NewOverlaySiteForm />;
  if (mode === "reference") return <NewReferenceSiteForm />;
  return <NewSiteForm blank={mode === "blank"} />;
}
