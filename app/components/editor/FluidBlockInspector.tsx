"use client";

import { AlignCenter, AlignLeft, AlignRight, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import SegmentedControl from "@/app/components/ui/segmented-control";
import type { FluidAlign, FluidBlock, TextVariant } from "@/src/lib/fluid";
import { cn } from "@/src/lib/utils";
import ImageUploadField from "./fields/ImageUploadField";
import LinkField from "./fields/LinkField";
import DownloadUploadField from "./fields/DownloadUploadField";
import { useEditorSite } from "./EditorSiteContext";
import { publicDownloadHref } from "@/src/lib/site-downloads";
import BlockEditor from "./BlockEditor";
import type { SectionId } from "@/src/lib/types";

const TEXT_VARIANTS: { value: TextVariant; label: string; preview: string }[] = [
  { value: "display", label: "Näyttävä", preview: "text-lg font-semibold tracking-tight" },
  { value: "h1", label: "Otsikko 1", preview: "text-base font-semibold tracking-tight" },
  { value: "h2", label: "Otsikko 2", preview: "text-sm font-semibold" },
  { value: "h3", label: "Otsikko 3", preview: "text-xs font-semibold" },
  { value: "body", label: "Leipäteksti", preview: "text-xs" },
  { value: "small", label: "Pieni", preview: "text-[11px] text-muted-foreground" },
  { value: "eyebrow", label: "Yläotsikko", preview: "text-[10px] font-semibold uppercase tracking-widest" },
];

const ALIGN_OPTIONS: { value: FluidAlign; label: React.ReactNode; title: string }[] = [
  { value: "left", label: <AlignLeft className="size-4" aria-label="Vasen" />, title: "Vasen" },
  { value: "center", label: <AlignCenter className="size-4" aria-label="Keskellä" />, title: "Keskellä" },
  { value: "right", label: <AlignRight className="size-4" aria-label="Oikea" />, title: "Oikea" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/** Valitun lohkon ominaisuudet. Sijainti ja koko muutetaan suoraan sivulla. */
export default function FluidBlockInspector({
  block,
  onChange,
  onRemove,
  crmEnabled,
}: {
  block: FluidBlock;
  onChange: (block: FluidBlock) => void;
  onRemove: () => void;
  crmEnabled: boolean;
}) {
  const siteId = useEditorSite();
  return (
    <div className="space-y-5">
      {block.type === "component" && (
        <BlockEditor
          section={{
            id: block.id as unknown as SectionId,
            type: block.content.sectionType,
            content: block.content.data,
            isVisible: true,
          }}
          crmEnabled={crmEnabled}
          onUpdate={(data) =>
            onChange({ ...block, content: { ...block.content, data: data as typeof block.content.data } })
          }
        />
      )}

      {block.type === "text" && (
        <>
          <Field label="Tyyli">
            <div className="grid grid-cols-2 gap-1.5">
              {TEXT_VARIANTS.map((variant) => (
                <button
                  key={variant.value}
                  type="button"
                  onClick={() => onChange({ ...block, content: { ...block.content, variant: variant.value } })}
                  className={cn(
                    "rounded-lg border px-2.5 py-2 text-left transition-colors",
                    block.content.variant === variant.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-foreground/30",
                  )}
                >
                  <span className={cn("block truncate", variant.preview)}>{variant.label}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Teksti">
            <Textarea
              value={block.content.text}
              rows={4}
              onChange={(e) => onChange({ ...block, content: { ...block.content, text: e.target.value } })}
            />
          </Field>
          <Field label="Tasaus">
            <SegmentedControl
              size="sm"
              ariaLabel="Tasaus"
              value={block.content.align}
              onChange={(align) => onChange({ ...block, content: { ...block.content, align } })}
              options={ALIGN_OPTIONS}
            />
          </Field>
        </>
      )}

      {block.type === "image" && (
        <>
          <Field label="Kuva">
            <ImageUploadField
              value={block.content.src}
              onChange={(src) => onChange({ ...block, content: { ...block.content, src } })}
            />
          </Field>
          <Field label="Vaihtoehtoinen teksti (saavutettavuus ja SEO)">
            <Input
              value={block.content.alt}
              placeholder="Mitä kuvassa on?"
              onChange={(e) => onChange({ ...block, content: { ...block.content, alt: e.target.value } })}
            />
          </Field>
          <Field label="Rajaus">
            <SegmentedControl
              size="sm"
              ariaLabel="Rajaus"
              value={block.content.fit}
              onChange={(fit) => onChange({ ...block, content: { ...block.content, fit } })}
              options={[
                { value: "cover", label: "Täytä" },
                { value: "contain", label: "Sovita" },
              ]}
            />
          </Field>
          <Field label={`Kulmien pyöristys · ${block.content.radius} px`}>
            <input
              type="range"
              min={0}
              max={48}
              step={2}
              value={block.content.radius}
              onChange={(e) =>
                onChange({ ...block, content: { ...block.content, radius: Number(e.target.value) } })
              }
              className="w-full accent-primary"
              aria-label="Kulmien pyöristys"
            />
          </Field>
        </>
      )}

      {block.type === "button" && (
        <>
          <Field label="Teksti">
            <Input
              value={block.content.label}
              onChange={(e) => onChange({ ...block, content: { ...block.content, label: e.target.value } })}
            />
          </Field>
          <Field label="Linkki">
            <LinkField
              value={block.content.href}
              onChange={(href) =>
                // Käsin vaihdettu linkki irrottaa liitetyn tiedoston.
                onChange({ ...block, content: { ...block.content, href, download: undefined } })
              }
            />
          </Field>
          <Field label="Tai lataa tiedosto suoraan">
            <DownloadUploadField
              kind="public"
              value={block.content.download}
              onChange={(download) =>
                onChange({
                  ...block,
                  content: {
                    ...block.content,
                    download,
                    href: download ? publicDownloadHref(siteId, download.path) : "",
                  },
                })
              }
            />
          </Field>
          <Field label="Tyyli">
            <SegmentedControl
              size="sm"
              ariaLabel="Painikkeen tyyli"
              value={block.content.variant}
              onChange={(variant) => onChange({ ...block, content: { ...block.content, variant } })}
              options={[
                { value: "primary", label: "Pää" },
                { value: "secondary", label: "Toissijainen" },
                { value: "link", label: "Linkki" },
              ]}
            />
          </Field>
          <Field label="Tasaus">
            <SegmentedControl
              size="sm"
              ariaLabel="Tasaus"
              value={block.content.align}
              onChange={(align) => onChange({ ...block, content: { ...block.content, align } })}
              options={ALIGN_OPTIONS}
            />
          </Field>
        </>
      )}

      <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        {block.type === "component"
          ? "Siirrä osiota sen vasemman reunan kahvasta ja muuta kokoa kulmista. Tekstejä voi muokata suoraan sivulla."
          : "Raahaa lohkoa sivulla siirtääksesi sitä ja vedä kulmista muuttaaksesi kokoa. Nuolinäppäimet siirtävät ruudun kerrallaan (Shift = 4)."}
      </p>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 aria-hidden />
        Poista lohko
      </Button>
    </div>
  );
}
