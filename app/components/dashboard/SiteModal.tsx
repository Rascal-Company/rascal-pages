"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import { siteAdminNavItems, type SiteModalKey } from "@/src/lib/site-admin-nav";
import { cn } from "@/src/lib/utils";
import { SITE_ADMIN_NAV_ICONS } from "./SiteAdminNav";

/**
 * Sivuston hallintaikkuna editorin päällä (Webflow/Squarespace-tyyliin):
 * vasemmalla sivut, blogi, analytiikka ja asetukset, oikealla valittu näkymä.
 * Sulkeminen palaa historiassa editoriin; näkymän vaihto korvaa osoitteen,
 * joten takaisin-painike sulkee ikkunan kerralla.
 */
export default function SiteModal({
  active,
  children,
}: {
  active: SiteModalKey;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  // Sivusto osoitteesta: myös latausnäkymä (loading.tsx ei saa parametreja).
  const { id: siteId } = useParams<{ id: string }>();
  const items = siteAdminNavItems(siteId, "pages").filter((item) => item.key !== "editor");
  const current = items.find((item) => item.key === active);

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && router.back()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-2 z-50 mx-auto flex max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] sm:inset-6 md:flex-row"
        >
          {/* Näkymät */}
          <nav
            aria-label="Sivuston hallinta"
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-border p-2 [scrollbar-width:none] md:w-56 md:flex-col md:border-b-0 md:border-r md:p-3"
          >
            <p className="hidden px-2.5 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:block">
              Sivusto
            </p>
            {items.map((item) => {
              const Icon = SITE_ADMIN_NAV_ICONS[item.key];
              const selected = item.key === active;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  replace
                  scroll={false}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
                    selected
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Valittu näkymä */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
              <DialogPrimitive.Title className="text-sm font-semibold">{current?.label}</DialogPrimitive.Title>
              <DialogPrimitive.Close
                aria-label="Sulje (Esc)"
                title="Sulje (Esc)"
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </DialogPrimitive.Close>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-brand-light">
              {children ?? (
                <div className="flex h-full min-h-48 items-center justify-center text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" aria-label="Ladataan" />
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
