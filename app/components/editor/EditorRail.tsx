"use client";

import Link from "next/link";
import { FileSearch, LayoutList, Palette, type LucideIcon } from "lucide-react";
import { siteAdminNavItems } from "@/src/lib/site-admin-nav";
import { SITE_ADMIN_NAV_ICONS } from "@/app/components/dashboard/SiteAdminNav";
import { cn } from "@/src/lib/utils";
import type { SiteId } from "@/src/lib/types";

export type PanelTab = "sections" | "style" | "page";

const PANEL_TABS: { value: PanelTab; label: string; icon: LucideIcon }[] = [
  { value: "sections", label: "Osiot", icon: LayoutList },
  { value: "style", label: "Tyyli", icon: Palette },
  { value: "page", label: "SEO", icon: FileSearch },
];

const itemClass =
  "flex w-14 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium leading-none transition-colors [&_svg]:size-5";

/**
 * Editorin vasen palkki (Webflow/Squarespace-tyyliin). Ylhäällä sivun
 * muokkauspaneelit, alla sivuston hallinta, joka avautuu ikkunana editorin
 * päälle. Aktiivisen paneelin uusi klikkaus piilottaa paneelin.
 */
export default function EditorRail({
  siteId,
  panelTab,
  panelOpen,
  onPanel,
}: {
  siteId: SiteId;
  panelTab: PanelTab;
  panelOpen: boolean;
  onPanel: (tab: PanelTab) => void;
}) {
  const siteItems = siteAdminNavItems(siteId, "pages").filter((item) => item.key !== "editor");

  return (
    <nav
      aria-label="Editorin valikko"
      className="flex w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-border bg-card py-2"
    >
      {PANEL_TABS.map(({ value, label, icon: Icon }) => {
        const active = panelOpen && panelTab === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onPanel(value)}
            aria-pressed={active}
            className={cn(
              itemClass,
              active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Icon aria-hidden />
            {label}
          </button>
        );
      })}

      <span className="my-1.5 h-px w-8 bg-border" aria-hidden />

      {siteItems.map((item) => {
        const Icon = SITE_ADMIN_NAV_ICONS[item.key];
        return (
          <Link
            key={item.key}
            href={item.href}
            scroll={false}
            className={cn(itemClass, "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}
          >
            <Icon aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
