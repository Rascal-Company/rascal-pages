import NewSiteForm from "./NewSiteForm";
import NewOverlaySiteForm from "./NewOverlaySiteForm";

interface PageProps {
  searchParams: Promise<{ mode?: string }>;
}

/** Uusi sivusto: ?mode=blank (tyhjä sivu) tai ?mode=overlay (asiakkaan sivu). */
export default async function NewSitePage({ searchParams }: PageProps) {
  const { mode } = await searchParams;
  if (mode === "overlay") return <NewOverlaySiteForm />;
  return <NewSiteForm blank={mode === "blank"} />;
}
