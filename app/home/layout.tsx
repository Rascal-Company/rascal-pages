import type { ReactNode } from "react";
import Script from "next/script";

/**
 * Layout for the public marketing site (rascalpages.fi → /home/*). Loads the
 * analytics script only here, so dashboard and customer sites aren't tracked.
 */
export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script
        src="https://analytiikka.analytiikka.workers.dev/t.js"
        data-site="7be133da"
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
