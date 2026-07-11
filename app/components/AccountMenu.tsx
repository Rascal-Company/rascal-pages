"use client";

import { fetchProducts, fetchProfile, type RascalProduct, type RascalProfile } from "@rascal/auth";
import { Check, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { logout } from "@/src/lib/oidc";
import { cn } from "@/src/lib/utils";
import { createClient } from "@/src/utils/supabase/client";

const ID_ACCOUNT_URL = "https://id.rascalai.fi/account";
const CURRENT_SLUG = "rascal-pages";

// Google-tyylinen tilivalikko Pagesin dashboard-headeriin: yrityksen logo +
// avatar -pilleri (tai pelkkä avatar) → dropdown (yrityskonteksti, Hallitse
// tiliä, tuotevaihto, logout). Sama sisältö kuin muissa tuotteissa; logout
// käyttää Pagesin omaa oidc-logoutia.
export function AccountMenu() {
  const [profile, setProfile] = useState<RascalProfile | null>(null);
  const [products, setProducts] = useState<RascalProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    fetchProfile(supabase).then((p) => {
      if (!cancelled) setProfile(p);
    });
    fetchProducts(supabase).then((list) => {
      if (!cancelled) setProducts(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const initial = (profile?.name || profile?.email || "?").charAt(0).toUpperCase();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        {profile?.logoUrl ? (
          <button
            type="button"
            className="flex h-11 items-center gap-2.5 rounded-full border border-foreground/15 bg-card py-1 pr-1 pl-3.5 shadow-sm transition-shadow hover:shadow-md"
            aria-label="Tili"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.logoUrl} alt="" className="h-6 max-w-[92px] object-contain" />
            <span className="h-6 w-px bg-foreground/15" />
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/12 text-sm font-semibold text-primary">
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary/12 text-base font-semibold text-primary shadow-sm ring-1 ring-foreground/15 transition-shadow hover:shadow-md"
            aria-label="Tili"
          >
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-72 p-0">
        {/* Yrityskonteksti */}
        {profile?.logoUrl || profile?.companyName ? (
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            {profile?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoUrl} alt="" className="h-6 max-w-[120px] object-contain" />
            ) : null}
            {profile?.companyName ? (
              <span className="truncate text-sm font-medium text-foreground">
                {profile.companyName}
              </span>
            ) : null}
          </div>
        ) : null}
        {/* Henkilö */}
        <div className="flex items-center gap-3 border-b border-border p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/12 text-base font-semibold text-primary">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </span>
          <div className="min-w-0">
            {profile?.name ? (
              <p className="truncate text-sm font-semibold text-foreground">{profile.name}</p>
            ) : null}
            <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
          </div>
        </div>

        <a
          href={ID_ACCOUNT_URL}
          className="flex items-center gap-2.5 px-4 py-3 text-sm text-foreground transition-colors hover:bg-accent"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
          Hallitse tiliä
        </a>

        {products.length > 0 && (
          <div className="border-t border-border py-1.5">
            <p className="px-4 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">
              Vaihda tuotetta
            </p>
            {products.map((product) => {
              const isCurrent = product.slug === CURRENT_SLUG;
              return (
                <a
                  key={product.slug}
                  href={product.url}
                  aria-current={isCurrent ? "page" : undefined}
                  className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-accent"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground">
                    {product.glyph}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm text-foreground",
                      isCurrent && "font-medium",
                    )}
                  >
                    {product.name}
                  </span>
                  {isCurrent ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                </a>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-2.5 border-t border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Kirjaudu ulos
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
