/**
 * Sivuston näkymät: editori (children) ja sen päälle avautuva hallintaikkuna
 * (@modal: sivut, blogi, analytiikka, asetukset). Ikkuna on intercepting route,
 * joten editori pysyy taustalla tallessa ja osoite on silti jaettava.
 */
export default function SiteLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
