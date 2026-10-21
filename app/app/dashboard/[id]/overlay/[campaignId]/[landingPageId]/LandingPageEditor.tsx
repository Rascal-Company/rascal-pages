"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Loader2, Plus, Sparkles, Trash2, UserRound } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
import {
  createOverlayVariant,
  deleteOverlayLandingPage,
  deleteOverlayVariant,
  personalizeOverlayVariant,
  saveOverlayLandingPage,
  saveOverlayVariant,
  type OverlayProfile,
  type OverlayVariation,
} from "@/app/actions/overlay";
import type { SiteId } from "@/src/lib/types";
import {
  OVERLAY_MATCH_KEYS,
  type OverlayChange,
  type OverlayChangeType,
  type OverlayMatch,
  type OverlayVariantId,
} from "@/src/lib/overlay";
import {
  buildChanges,
  textSlots,
  type OverlayCampaignId,
  type OverlayLandingPageId,
  type OverlaySlot,
  type OverlaySlotId,
} from "@/src/lib/overlay-campaign";
import {
  buildSelector,
  canEditText,
  fingerprintOf,
  normalizeText,
} from "@/src/lib/overlay-selector";

type LandingPageState = {
  name: string;
  pathPattern: string;
  match: OverlayMatch;
  profileId: string | null;
  slots: OverlaySlot[];
};

type Selection = {
  selector: string;
  tag: string;
  types: OverlayChangeType[];
  originals: Record<OverlayChangeType, string>;
  preview: string;
};

type Tab = "elements" | "variants" | "settings";

type OverlayApi = { apply: (changes: OverlayChange[], doc?: Document) => number };

const TYPE_LABELS: Record<OverlayChangeType, string> = {
  text: "Teksti",
  image: "Kuva",
  link: "Linkki",
  hide: "Piilotus",
};

const MATCH_LABELS: Record<(typeof OVERLAY_MATCH_KEYS)[number], string> = {
  utm_term: "utm_term",
  utm_campaign: "utm_campaign",
  utm_content: "utm_content (creative)",
  rp: "rp (oma tunniste, esim. DM-avainsana)",
};

const EDITOR_STYLE = `
.__rp-hover{outline:2px dashed #6366f1!important;outline-offset:2px!important;cursor:pointer!important}
.__rp-selected{outline:3px solid #6366f1!important;outline-offset:2px!important}`;

function availableTypes(el: Element): OverlayChangeType[] {
  const types: OverlayChangeType[] = [];
  if (canEditText(el)) types.push("text");
  if (el.tagName === "IMG") types.push("image");
  if (el.tagName === "A" && el.hasAttribute("href")) types.push("link");
  types.push("hide");
  return types;
}

function suggestLabel(tag: string, type: OverlayChangeType, slots: OverlaySlot[]): string {
  let base = "Teksti";
  if (type === "image") base = "Kuva";
  else if (type === "link") base = "Linkki";
  else if (type === "hide") base = "Piilotettava osio";
  else if (/^h[1-6]$/.test(tag)) base = "Otsikko";
  else if (tag === "a" || tag === "button") base = "Painike";
  else if (tag === "p") base = "Leipäteksti";

  const taken = new Set(slots.map((s) => s.label));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}

function variantSnapshot(v: OverlayVariation): string {
  return JSON.stringify([v.name, v.prompt, v.values, v.active]);
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-3 py-3 text-sm font-medium ${
        active
          ? "border-b-2 border-primary text-brand-dark"
          : "text-brand-dark/60 hover:text-brand-dark"
      }`}
    >
      {children}
    </button>
  );
}

export default function LandingPageEditor({
  siteId,
  campaignId,
  landingPageId,
  targetOrigin,
  appOrigin,
  initialLandingPage,
  initialVariants,
  profiles,
}: {
  siteId: SiteId;
  campaignId: OverlayCampaignId;
  landingPageId: OverlayLandingPageId;
  targetOrigin: string;
  appOrigin: string;
  initialLandingPage: LandingPageState;
  initialVariants: OverlayVariation[];
  profiles: OverlayProfile[];
}) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const backHref = `/app/dashboard/${siteId}/overlay/${campaignId}`;

  const [page, setPage] = useState<LandingPageState>(initialLandingPage);
  const [savedPage, setSavedPage] = useState(JSON.stringify(initialLandingPage));
  const [variants, setVariants] = useState<OverlayVariation[]>(initialVariants);
  const [savedVariants, setSavedVariants] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialVariants.map((v) => [v.id, variantSnapshot(v)])),
  );
  const [selectedVariantId, setSelectedVariantId] = useState<OverlayVariantId | null>(
    initialVariants[0]?.id ?? null,
  );
  const [tab, setTab] = useState<Tab>(initialLandingPage.slots.length ? "variants" : "elements");

  const [previewPath, setPreviewPath] = useState(
    initialLandingPage.pathPattern.includes("*") ? "/" : initialLandingPage.pathPattern,
  );
  const [pathInput, setPathInput] = useState(previewPath);
  const [frameError, setFrameError] = useState<string | null>(null);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [slotType, setSlotType] = useState<OverlayChangeType>("text");
  const [slotLabel, setSlotLabel] = useState("");

  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<"page" | "variant" | null>(null);
  const [copied, setCopied] = useState(false);

  const variant = variants.find((v) => v.id === selectedVariantId) ?? null;
  const profile = profiles.find((p) => p.id === page.profileId) ?? null;

  const pageDirty = JSON.stringify(page) !== savedPage;
  const dirtyVariantIds = variants
    .filter((v) => savedVariants[v.id] !== variantSnapshot(v))
    .map((v) => v.id);
  const dirty = pageDirty || dirtyVariantIds.length > 0;

  // Esikatselussa näytetään valitun variaation muutokset.
  const previewChanges = useMemo<OverlayChange[]>(() => {
    if (!variant) return [];
    const result = buildChanges(page.slots, variant.values);
    return result.ok ? result.changes : [];
  }, [variant, page.slots]);

  // Iframen kuuntelijat ja latauskäsittelijä lukevat tuoreimman tilan refeistä.
  const previewChangesRef = useRef(previewChanges);
  const appliedIdsRef = useRef<Set<string>>(new Set());
  const slotsRef = useRef(page.slots);
  useEffect(() => {
    slotsRef.current = page.slots;
  }, [page.slots]);

  const frameSrc = `/api/overlay/proxy?c=${campaignId}&path=${encodeURIComponent(previewPath)}`;

  const applyPreview = useCallback((changes: OverlayChange[]) => {
    const win = iframeRef.current?.contentWindow as (Window & { __rpOverlay?: OverlayApi }) | null;
    const doc = iframeRef.current?.contentDocument;
    if (win?.__rpOverlay && doc) win.__rpOverlay.apply(changes, doc);
    appliedIdsRef.current = new Set(changes.map((c) => c.id as string));
  }, []);

  // Uudet ja muuttuneet muutokset ajetaan suoraan; poistettu muutos vaatii
  // sivun uudelleenlatauksen, jotta alkuperäinen sisältö palaa.
  useEffect(() => {
    previewChangesRef.current = previewChanges;
    const ids = new Set(previewChanges.map((c) => c.id as string));
    const removed = [...appliedIdsRef.current].some((id) => !ids.has(id));
    if (removed) {
      iframeRef.current?.contentWindow?.location.reload();
    } else {
      applyPreview(previewChanges);
    }
  }, [previewChanges, applyPreview]);

  const selectElement = useCallback((el: Element) => {
    const doc = el.ownerDocument;
    doc.querySelectorAll(".__rp-selected").forEach((n) => n.classList.remove("__rp-selected"));
    el.classList.add("__rp-selected");
    el.classList.remove("__rp-hover");

    const selector = buildSelector(el);
    const types = availableTypes(el);
    const originals = {} as Record<OverlayChangeType, string>;
    for (const type of types) {
      // Esikatselussa muokatun elementin alkuperäinen otetaan slotista.
      const slot = slotsRef.current.find((s) => s.selector === selector && s.type === type);
      originals[type] = slot?.original ?? fingerprintOf(el, type);
    }
    const tag = el.tagName.toLowerCase();
    const first = types[0];
    const existing = slotsRef.current.find((s) => s.selector === selector && s.type === first);

    setSelection({
      selector,
      tag,
      types,
      originals,
      preview: first === "text" ? originals.text : normalizeText(el.textContent).slice(0, 120),
    });
    setSlotType(first);
    setSlotLabel(existing?.label ?? suggestLabel(tag, first, slotsRef.current));
    setTab("elements");
  }, []);

  const handleFrameLoad = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !doc.body) {
      setFrameError("Sivun lataus epäonnistui.");
      return;
    }
    setFrameError(null);
    setSelection(null);

    const style = doc.createElement("style");
    style.textContent = EDITOR_STYLE;
    doc.head?.appendChild(style);

    let hovered: Element | null = null;
    doc.addEventListener("mouseover", (e) => {
      hovered?.classList.remove("__rp-hover");
      hovered = e.target instanceof doc.defaultView!.Element ? (e.target as Element) : null;
      if (hovered && hovered !== doc.body && !hovered.classList.contains("__rp-selected")) {
        hovered.classList.add("__rp-hover");
      }
    });
    doc.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.target as Element | null;
        if (target && target !== doc.body && target !== doc.documentElement) {
          selectElement(target);
        }
      },
      true,
    );
    doc.addEventListener("submit", (e) => e.preventDefault(), true);

    applyPreview(previewChangesRef.current);
  }, [applyPreview, selectElement]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function highlightSlot(slot: OverlaySlot) {
    const doc = iframeRef.current?.contentDocument;
    const el = doc?.querySelector(slot.selector);
    if (!doc || !el) {
      setMessage({ kind: "error", text: `"${slot.label}" ei löydy tältä sivulta.` });
      return;
    }
    doc.querySelectorAll(".__rp-selected").forEach((n) => n.classList.remove("__rp-selected"));
    el.classList.add("__rp-selected");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // ---- Elementit ----

  const selectedSlot = selection
    ? page.slots.find((s) => s.selector === selection.selector && s.type === slotType)
    : undefined;

  function chooseSlotType(type: OverlayChangeType) {
    if (!selection) return;
    setSlotType(type);
    const existing = page.slots.find((s) => s.selector === selection.selector && s.type === type);
    setSlotLabel(existing?.label ?? suggestLabel(selection.tag, type, page.slots));
  }

  function upsertSlot() {
    if (!selection || !slotLabel.trim()) return;
    const slot: OverlaySlot = {
      id: selectedSlot?.id ?? (nanoid(10) as OverlaySlotId),
      label: slotLabel.trim(),
      selector: selection.selector,
      type: slotType,
      original: selection.originals[slotType],
    };
    setPage((p) => ({
      ...p,
      slots: selectedSlot ? p.slots.map((s) => (s.id === slot.id ? slot : s)) : [...p.slots, slot],
    }));
  }

  function removeSlot(id: OverlaySlotId) {
    setPage((p) => ({ ...p, slots: p.slots.filter((s) => s.id !== id) }));
  }

  function renameSlot(id: OverlaySlotId, label: string) {
    setPage((p) => ({ ...p, slots: p.slots.map((s) => (s.id === id ? { ...s, label } : s)) }));
  }

  // ---- Variaatiot ----

  function updateVariant(patch: Partial<OverlayVariation>) {
    if (!variant) return;
    setVariants((list) => list.map((v) => (v.id === variant.id ? { ...v, ...patch } : v)));
  }

  function setSlotValue(slotId: OverlaySlotId, value: string) {
    if (!variant) return;
    updateVariant({ values: { ...variant.values, [slotId]: value } });
  }

  async function addVariant() {
    setBusy(true);
    setMessage(null);
    const result = await createOverlayVariant(landingPageId, {
      name: `Variaatio ${variants.length + 1}`,
    });
    setBusy(false);
    if (!result.success) {
      setMessage({ kind: "error", text: result.error });
      return;
    }
    setVariants((list) => [...list, result.data]);
    setSavedVariants((s) => ({ ...s, [result.data.id]: variantSnapshot(result.data) }));
    setSelectedVariantId(result.data.id);
    setTab("variants");
  }

  async function savePageIfDirty(): Promise<boolean> {
    if (!pageDirty) return true;
    const result = await saveOverlayLandingPage(landingPageId, page);
    if (!result.success) {
      setMessage({ kind: "error", text: result.error });
      return false;
    }
    setSavedPage(JSON.stringify(page));
    return true;
  }

  async function handleSave() {
    setBusy(true);
    setMessage(null);
    try {
      if (!(await savePageIfDirty())) return;
      for (const id of dirtyVariantIds) {
        const v = variants.find((x) => x.id === id);
        if (!v) continue;
        const result = await saveOverlayVariant(v.id, v);
        if (!result.success) {
          setMessage({ kind: "error", text: `${v.name}: ${result.error}` });
          return;
        }
        setSavedVariants((s) => ({ ...s, [v.id]: variantSnapshot(v) }));
      }
      setMessage({ kind: "ok", text: "Tallennettu." });
    } finally {
      setBusy(false);
    }
  }

  async function handlePersonalize() {
    if (!variant) return;
    setGenerating(true);
    setMessage(null);
    try {
      // AI kirjoittaa tallennettuihin elementteihin tallennetulle profiilille.
      if (!(await savePageIfDirty())) return;
      const result = await personalizeOverlayVariant(landingPageId, { angle: variant.prompt });
      if (!result.success) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      updateVariant({ values: { ...variant.values, ...result.data.values } });
      setMessage({ kind: "ok", text: "Personoitu — tarkista tekstit ja tallenna." });
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteVariant() {
    if (!variant) return;
    if (confirmDelete !== "variant") {
      setConfirmDelete("variant");
      return;
    }
    setConfirmDelete(null);
    setBusy(true);
    const result = await deleteOverlayVariant(variant.id);
    setBusy(false);
    if (!result.success) {
      setMessage({ kind: "error", text: result.error });
      return;
    }
    const rest = variants.filter((v) => v.id !== variant.id);
    setVariants(rest);
    setSelectedVariantId(rest[0]?.id ?? null);
  }

  async function handleDeletePage() {
    if (confirmDelete !== "page") {
      setConfirmDelete("page");
      return;
    }
    setBusy(true);
    const result = await deleteOverlayLandingPage(landingPageId);
    if (result.success) {
      router.push(backHref);
    } else {
      setBusy(false);
      setMessage({ kind: "error", text: result.error });
    }
  }

  const shareUrl = useMemo(() => {
    if (!variant) return "";
    const url = new URL("/api/overlay/preview", appOrigin);
    url.searchParams.set("t", variant.previewToken);
    url.searchParams.set("path", previewPath);
    return url.toString();
  }, [appOrigin, variant, previewPath]);

  const productionUrl = useMemo(() => {
    const url = new URL(previewPath, targetOrigin);
    for (const key of OVERLAY_MATCH_KEYS) {
      const value = page.match[key];
      if (value) url.searchParams.set(key, value);
    }
    return url.toString();
  }, [previewPath, targetOrigin, page.match]);

  async function copyShareUrl() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hasTextSlots = textSlots(page.slots).length > 0;
  const liveCount = variants.filter((v) => v.active).length;

  return (
    <div className="flex min-h-screen flex-col bg-brand-light lg:h-screen">
      {/* Yläpalkki */}
      <header className="flex flex-wrap items-center gap-3 border-b border-brand-dark/10 bg-card px-4 py-3">
        <Link href={backHref} className="text-sm text-brand-dark/70 hover:text-brand-dark">
          ← Kampanja
        </Link>
        <Input
          value={page.name}
          onChange={(e) => setPage((p) => ({ ...p, name: e.target.value }))}
          className="h-8 min-w-0 flex-1 font-medium sm:max-w-xs"
          aria-label="Laskeutumissivun nimi"
        />
        <span className="hidden text-xs text-brand-dark/60 sm:inline">
          {liveCount}/{variants.length} julkaistu
        </span>
        <div className="ml-auto flex items-center gap-2">
          {message && (
            <span className={`text-sm ${message.kind === "ok" ? "text-green-700" : "text-red-600"}`}>
              {message.text}
            </span>
          )}
          <Button size="sm" onClick={handleSave} disabled={busy || generating || !dirty}>
            {busy ? "Tallennetaan…" : dirty ? "Tallenna" : "Tallennettu"}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Esikatselu */}
        <div className="flex min-h-[60vh] min-w-0 flex-1 flex-col lg:min-h-0">
          <form
            className="flex gap-2 border-b border-brand-dark/10 bg-card px-4 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              const path = pathInput.startsWith("/") ? pathInput : `/${pathInput}`;
              setPathInput(path);
              setPreviewPath(path);
            }}
          >
            <span className="hidden self-center truncate text-sm text-brand-dark/60 sm:block">
              {targetOrigin}
            </span>
            <Input
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              className="h-8 min-w-0 flex-1"
              aria-label="Esikatseltava polku"
            />
            <Button type="submit" size="sm" variant="outline">
              Avaa
            </Button>
          </form>
          {frameError && <p className="bg-red-50 px-4 py-2 text-sm text-red-700">{frameError}</p>}
          <iframe
            key={frameSrc}
            ref={iframeRef}
            src={frameSrc}
            onLoad={handleFrameLoad}
            className="min-h-0 w-full flex-1 bg-white"
            title="Sivun esikatselu"
          />
        </div>

        {/* Sivupaneeli */}
        <aside className="flex w-full shrink-0 flex-col border-t border-brand-dark/10 bg-card lg:w-[26rem] lg:border-l lg:border-t-0">
          <div className="flex border-b border-brand-dark/10">
            <TabButton active={tab === "elements"} onClick={() => setTab("elements")}>
              Elementit ({page.slots.length})
            </TabButton>
            <TabButton active={tab === "variants"} onClick={() => setTab("variants")}>
              Variaatiot ({variants.length})
            </TabButton>
            <TabButton active={tab === "settings"} onClick={() => setTab("settings")}>
              Asetukset
            </TabButton>
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
            {tab === "elements" && (
              <>
                <section>
                  <h2 className="text-sm font-semibold text-brand-dark">Valittu elementti</h2>
                  {!selection ? (
                    <p className="mt-2 text-sm text-brand-dark/60">
                      Klikkaa esikatselussa elementtiä, jota haluat personoida, ja lisää se
                      elementtilistaan. Variaatiot täyttävät listan elementit omilla
                      sisällöillään.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-3">
                      <p className="line-clamp-3 rounded bg-brand-light px-2 py-1 text-sm text-brand-dark/80">
                        &lt;{selection.tag}&gt; {selection.preview || "(ei tekstiä)"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selection.types.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => chooseSlotType(type)}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                              slotType === type
                                ? "bg-primary text-primary-foreground"
                                : "bg-brand-light text-brand-dark/80 hover:bg-brand-dark/10"
                            }`}
                          >
                            {TYPE_LABELS[type]}
                          </button>
                        ))}
                      </div>
                      {!selection.types.includes("text") && (
                        <p className="text-xs text-brand-dark/60">
                          Tekstiä voi vaihtaa vain elementistä, jonka sisällä ei ole muita
                          elementtejä — klikkaa tarkemmin itse tekstiä.
                        </p>
                      )}
                      <div className="space-y-1">
                        <Label htmlFor="slot-label" className="text-xs">
                          Nimi (näkyy variaatioissa ja AI:lle)
                        </Label>
                        <Input
                          id="slot-label"
                          value={slotLabel}
                          onChange={(e) => setSlotLabel(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={upsertSlot}
                        className="w-full"
                        disabled={!slotLabel.trim()}
                      >
                        <Plus aria-hidden />
                        {selectedSlot ? "Päivitä elementti" : "Lisää elementtilistaan"}
                      </Button>
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-sm font-semibold text-brand-dark">Elementtilista</h2>
                  {page.slots.length === 0 ? (
                    <p className="mt-2 text-sm text-brand-dark/60">Ei vielä elementtejä.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {page.slots.map((slot) => (
                        <li key={slot.id} className="rounded-md border border-brand-dark/10 p-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={slot.label}
                              onChange={(e) => renameSlot(slot.id, e.target.value)}
                              className="h-7 min-w-0 flex-1 text-sm"
                              aria-label="Elementin nimi"
                            />
                            <span className="shrink-0 text-xs text-brand-dark/60">
                              {TYPE_LABELS[slot.type]}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSlot(slot.id)}
                              className="shrink-0 text-brand-dark/50 hover:text-red-600"
                              aria-label={`Poista ${slot.label}`}
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => highlightSlot(slot)}
                            className="mt-1 block w-full truncate text-left text-xs text-brand-dark/60 hover:text-brand-dark"
                          >
                            {slot.type === "hide" ? `<${slot.original}>` : slot.original}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}

            {tab === "variants" && (
              <>
                <section className="flex items-start gap-2 rounded-md bg-brand-light p-3 text-sm">
                  <UserRound className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <p className="text-brand-dark/80">
                    {profile ? (
                      <>
                        Kohderyhmä: <span className="font-medium">{profile.name}</span>
                      </>
                    ) : (
                      <>
                        Ei profiilia — AI kirjoittaa yrityksen ihanneasiakkaalle. Valitse
                        profiili{" "}
                        <button
                          type="button"
                          className="font-medium text-primary hover:underline"
                          onClick={() => setTab("settings")}
                        >
                          asetuksista
                        </button>
                        .
                      </>
                    )}
                  </p>
                </section>

                <section className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariantId(v.id);
                          setConfirmDelete(null);
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          v.id === selectedVariantId
                            ? "bg-primary text-primary-foreground"
                            : "bg-brand-light text-brand-dark/80 hover:bg-brand-dark/10"
                        }`}
                      >
                        {v.name}
                        {v.active && " •"}
                      </button>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" disabled={busy} onClick={addVariant}>
                    <Plus aria-hidden />
                    Uusi variaatio
                  </Button>
                  {variants.length > 1 && (
                    <p className="text-xs text-brand-dark/60">
                      Julkaistut variaatiot jakavat liikenteen tasan (A/B-testi). Sama kävijä
                      näkee aina saman variaation.
                    </p>
                  )}
                </section>

                {!variant ? (
                  <p className="text-sm text-brand-dark/60">Luo ensimmäinen variaatio.</p>
                ) : (
                  <>
                    <section className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="var-name" className="text-xs">
                          Nimi
                        </Label>
                        <Input
                          id="var-name"
                          value={variant.name}
                          onChange={(e) => updateVariant({ name: e.target.value })}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="var-prompt" className="text-xs">
                          AI-ohje (vapaaehtoinen) — millä kulmalla tämä variaatio puhuu?
                        </Label>
                        <Textarea
                          id="var-prompt"
                          value={variant.prompt}
                          onChange={(e) => updateVariant({ prompt: e.target.value })}
                          rows={3}
                          placeholder="Esim. Selkeämpi ja yksinkertaisempi. Korosta ajansäästöä."
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handlePersonalize}
                        disabled={generating || busy || !hasTextSlots}
                        className="w-full"
                      >
                        {generating ? (
                          <Loader2 className="animate-spin" aria-hidden />
                        ) : (
                          <Sparkles aria-hidden />
                        )}
                        {generating ? "Personoidaan…" : "Personoi AI:lla"}
                      </Button>
                      <p className="text-xs text-brand-dark/60">
                        {hasTextSlots
                          ? "AI käyttää kohderyhmäprofiilia, AI-ohjetta ja yrityksen Rascal AI -profiilia (yrityskuvaus, ihanneasiakas, äänensävy)."
                          : "Lisää ensin tekstielementtejä Elementit-välilehdellä."}
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h2 className="text-sm font-semibold text-brand-dark">Sisältö</h2>
                      {page.slots.length === 0 && (
                        <p className="text-sm text-brand-dark/60">Ei elementtejä.</p>
                      )}
                      {page.slots.map((slot) => (
                        <div key={slot.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => highlightSlot(slot)}
                            className="text-xs font-medium text-brand-dark/80 hover:text-brand-dark"
                          >
                            {slot.label}
                          </button>
                          {slot.type === "hide" ? (
                            <label className="flex items-center gap-2 text-sm text-brand-dark/80">
                              <Switch
                                checked={variant.values[slot.id] === "1"}
                                onCheckedChange={(on) => setSlotValue(slot.id, on ? "1" : "")}
                              />
                              Piilota tässä variaatiossa
                            </label>
                          ) : slot.type === "text" ? (
                            <Textarea
                              value={variant.values[slot.id] ?? ""}
                              onChange={(e) => setSlotValue(slot.id, e.target.value)}
                              placeholder={slot.original}
                              rows={2}
                            />
                          ) : (
                            <Input
                              value={variant.values[slot.id] ?? ""}
                              onChange={(e) => setSlotValue(slot.id, e.target.value)}
                              placeholder={slot.original}
                              className="h-8"
                            />
                          )}
                        </div>
                      ))}
                    </section>

                    <section>
                      <h2 className="text-sm font-semibold text-brand-dark">1. Esikatselulinkki</h2>
                      <p className="mt-1 text-xs text-brand-dark/60">
                        Toimii heti — ei vaadi snippetiä, kirjautumista eikä julkaisua. Näyttää
                        tallennetut muutokset.
                      </p>
                      {dirtyVariantIds.includes(variant.id) && (
                        <p className="mt-1 text-xs font-medium text-amber-700">
                          Tallenna, jotta uusimmat muutokset näkyvät linkissä.
                        </p>
                      )}
                      <code className="mt-2 block break-all rounded bg-brand-light px-2 py-1 text-xs text-brand-dark/80">
                        {shareUrl}
                      </code>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline" onClick={copyShareUrl}>
                          {copied ? "Kopioitu" : "Kopioi"}
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                            Avaa
                          </a>
                        </Button>
                      </div>
                    </section>

                    <section className="space-y-2">
                      <h2 className="text-sm font-semibold text-brand-dark">2. Tuotanto</h2>
                      <label className="flex items-center gap-2 text-sm text-brand-dark/80">
                        <Switch
                          checked={variant.active}
                          onCheckedChange={(active) => updateVariant({ active })}
                        />
                        {variant.active ? "Julkaistu" : "Luonnos"}
                      </label>
                      <p className="text-xs text-brand-dark/60">
                        Asiakkaan oikea sivu. Toimii, kun snippet on asennettu ja variaatio
                        julkaistu.
                      </p>
                      <code className="block break-all rounded bg-brand-light px-2 py-1 text-xs text-brand-dark/80">
                        {productionUrl}
                      </code>
                    </section>

                    <section className="border-t border-brand-dark/10 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteVariant}
                        disabled={busy}
                        className="w-full border-red-300 text-red-600 hover:bg-red-50"
                      >
                        {confirmDelete === "variant" ? "Vahvista poisto" : "Poista variaatio"}
                      </Button>
                    </section>
                  </>
                )}
              </>
            )}

            {tab === "settings" && (
              <>
                <section className="space-y-1">
                  <Label htmlFor="profile" className="text-xs">
                    Kohderyhmäprofiili
                  </Label>
                  <select
                    id="profile"
                    value={page.profileId ?? ""}
                    onChange={(e) =>
                      setPage((p) => ({ ...p, profileId: e.target.value || null }))
                    }
                    className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    <option value="">Ei profiilia</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <Link
                    href={`/app/dashboard/${siteId}/overlay/profiles`}
                    className="inline-block text-xs font-medium text-primary hover:underline"
                  >
                    Hallitse profiileja
                  </Link>
                </section>

                <section className="space-y-3">
                  <div>
                    <h2 className="text-sm font-semibold text-brand-dark">Kohdennus</h2>
                    <p className="mt-1 text-xs text-brand-dark/60">
                      Laskeutumissivu näytetään, kun kaikki täytetyt parametrit täsmäävät.
                      Tyhjä = kaikki kävijät.
                    </p>
                  </div>
                  {OVERLAY_MATCH_KEYS.map((key) => (
                    <div key={key} className="space-y-1">
                      <Label htmlFor={`match-${key}`} className="text-xs">
                        {MATCH_LABELS[key]}
                      </Label>
                      <Input
                        id={`match-${key}`}
                        value={page.match[key] ?? ""}
                        onChange={(e) =>
                          setPage((p) => ({ ...p, match: { ...p.match, [key]: e.target.value } }))
                        }
                        className="h-8"
                      />
                    </div>
                  ))}
                </section>

                <section className="space-y-1">
                  <Label htmlFor="path-pattern" className="text-xs">
                    Sivun polku (* = mikä tahansa)
                  </Label>
                  <Input
                    id="path-pattern"
                    value={page.pathPattern}
                    onChange={(e) => setPage((p) => ({ ...p, pathPattern: e.target.value }))}
                    className="h-8"
                  />
                </section>

                <section className="border-t border-brand-dark/10 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeletePage}
                    disabled={busy}
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {confirmDelete === "page"
                      ? "Vahvista laskeutumissivun poisto"
                      : "Poista laskeutumissivu"}
                  </Button>
                </section>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
