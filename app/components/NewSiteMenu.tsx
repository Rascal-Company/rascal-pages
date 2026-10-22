"use client";

import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Copy,
  FilePlus2,
  LayoutTemplate,
  MousePointerClick,
  Plus,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

type Option = {
  label: string;
  description: string;
  icon: LucideIcon;
  onSelect: () => void;
};

/** "Uusi sivusto" -valikko: AI, referensseistä, pohjasta, overlay asiakkaan sivulle tai blankko. */
export default function NewSiteMenu({
  onAiClick,
  className,
}: {
  onAiClick: () => void;
  className?: string;
}) {
  const router = useRouter();

  const options: Option[] = [
    {
      icon: Sparkles,
      label: "Luo AI:n avulla",
      description: "Kerro yrityksestä, AI tekee sivun valmiiksi",
      onSelect: onAiClick,
    },
    {
      icon: Copy,
      label: "Referensseistä",
      description: "Anna sivuja, joiden ilmeestä pidät, AI tekee samantyylisen",
      onSelect: () => router.push("/app/dashboard/new?mode=reference"),
    },
    {
      icon: LayoutTemplate,
      label: "Pohjasta",
      description: "Valmis landing page -pohja muokattavaksi",
      onSelect: () => router.push("/app/dashboard/new"),
    },
    {
      icon: MousePointerClick,
      label: "Overlay asiakkaan sivulle",
      description: "Personoi olemassa oleva sivusto kampanjakohtaisesti",
      onSelect: () => router.push("/app/dashboard/new?mode=overlay"),
    },
    {
      icon: FilePlus2,
      label: "Blankko",
      description: "Tyhjä sivu, lisää osiot itse",
      onSelect: () => router.push("/app/dashboard/new?mode=blank"),
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          className ??
          "inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        }
      >
        <Plus className="size-4" aria-hidden />
        Uusi sivusto
        <ChevronDown className="size-4 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-2rem)]">
        {options.map((option, i) => (
          <div key={option.label}>
            {i === 2 && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={option.onSelect} className="items-start py-2">
              <option.icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </span>
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
