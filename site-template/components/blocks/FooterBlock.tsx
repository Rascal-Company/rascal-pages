/**
 * Footer section. Uses the site name from config rather than a hard-coded brand.
 */
export default function FooterBlock({ siteName }: { siteName: string }) {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="text-center">
          <p className="text-sm leading-5 text-gray-400">
            &copy; {new Date().getFullYear()} {siteName || "Rascal Site"}.
            Kaikki oikeudet pidätetään.
          </p>
        </div>
      </div>
    </footer>
  );
}
