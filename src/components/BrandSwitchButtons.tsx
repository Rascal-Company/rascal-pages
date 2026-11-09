"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

import { switchBrand, type BrandOption } from "@/app/actions/brand";

/** Suorat siirtymät muihin brändeihin, joilla Rascal Pages on käytössä. */
export function BrandSwitchButtons({ brands }: { brands: BrandOption[] }) {
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (orgId: string) => {
    if (switchingTo) return;
    setSwitchingTo(orgId);
    setError(null);
    const result = await switchBrand(orgId).catch(() => null);
    if (result?.success) {
      window.location.assign("/app/dashboard");
      return;
    }
    setSwitchingTo(null);
    setError(result && !result.success ? result.error : "Brändin vaihto epäonnistui.");
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {brands.map((brand) => (
        <button
          key={brand.id}
          type="button"
          onClick={() => void handleClick(brand.id)}
          disabled={switchingTo !== null}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-wait disabled:opacity-80"
        >
          <span className="truncate">Siirry: {brand.name}</span>
          {switchingTo === brand.id ? (
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="size-4 shrink-0" aria-hidden />
          )}
        </button>
      ))}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
