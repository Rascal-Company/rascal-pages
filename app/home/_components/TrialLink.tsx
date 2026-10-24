"use client";

import type { ReactNode } from "react";
import { getAppUrl, getRootDomain } from "@/app/lib/navigation";

type TrialLinkProps = {
  className?: string;
  children: ReactNode;
};

// Kokeilu ja kirjautuminen alkavat samasta paikasta: app-hostin /login käynnistää
// Rascal ID -flow'n. href osoittaa tuotantoon (toimii ilman JS:ää); klikkaus
// laskee osoitteen ajonaikaisesti, jotta localhost ohjautuu /app/loginiin.
export default function TrialLink({ className, children }: TrialLinkProps) {
  return (
    <a
      href={`https://app.${getRootDomain()}/login`}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        window.location.assign(getAppUrl("/login"));
      }}
    >
      {children}
    </a>
  );
}
