"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import {
  Check,
  ChevronLeft,
  Copy,
  Crosshair,
  ExternalLink,
  EyeOff,
  Image as ImageIcon,
  Link2,
  Loader2,
  Monitor,
  MousePointerClick,
  Plus,
  RotateCw,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  Type,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
import { useToast } from "@/app/components/ui/ToastContainer";
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
import { uploadSiteAsset } from "@/app/actions/upload-site-asset";
import { cn } from "@/src/lib/utils";
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
import SegmentedControl from "../../components/SegmentedControl";
import StatusPill from "../../components/StatusPill";
import ImageSlotField from "../../components/ImageSlotField";
import { createFrameHighlighter, type FrameHighlighter } from "../../components/frame-highlight";

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

type Tab = "content" | "targeting";
type Device = "desktop" | "tablet" | "mobile";

type OverlayApi = { apply: (changes: OverlayChange[], doc?: Document) => number };

const TYPE_META: Record<OverlayChangeType, { label: string; icon: LucideIcon }> = {
  text: { label: "Teksti", icon: Type },
  image: { label: "Kuva", icon: ImageIcon },
  link: { label: "Linkki", icon: Link2 },
  hide: { label: "Piilota", icon: EyeOff },
};

const MATCH_LABELS: Record<(typeof OVERLAY_MATCH_KEYS)[number], string> = {
  utm_term: "utm_term",
  utm_campaign: "utm_campaign",
  utm_content: "utm_content",
  rp: "rp (oma tunniste)",
};

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: "100%",
  tablet: "834px",
  mobile: "390px",
};

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

/** Kasvaa sisällön mukana, ettei pitkää tekstiä tarvitse vierittää pienessä laatikossa. */
function AutoTextarea(props: React.ComponentProps<typeof Textarea>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [props.value]);
  return <Textarea ref={ref} rows={1} {...props} className={cn("min-h-9 resize-none", props.className)} />;
}

function IconButton({
  label,
  onClick,
  children,
  className,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:opacity-50 motion-reduce:active:scale-100 [&_svg]:size-4",
        className,
      )}
    >
      {children}
    </button>
  );
}

export default function LandingPageEditor({
  siteId,
  campaignId,
  campaignName,
  landingPageId,
  targetOrigin,
  appOrigin,
  initialLandingPage,
  initialVariants,
  profiles,
}: {
  siteId: SiteId;
  campaignId: OverlayCampaignId;
  campaignName: string;
  landingPageId: OverlayLandingPageId;
  targetOrigin: string;
  appOrigin: string;
  initialLandingPage: LandingPageState;
  initialVariants: OverlayVariation[];
  profiles: OverlayProfile[];
}) {
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const highlighterRef = useRef<FrameHighlighter | null>(null);
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
  const [tab, setTab] = useState<Tab>("content");
  const [device, setDevice] = useState<Device>("desktop");

  const [previewPath, setPreviewPath] = useState(
    initialLandingPage.pathPattern.includes("*") ? "/" : initialLandingPage.pathPattern,
  );
  const [pathInput, setPathInput] = useState(previewPath);
  const [frameLoading, setFrameLoading] = useState(true);
  const [frameError, setFrameError] = useState(false);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectionType, setSelectionType] = useState<OverlayChangeType>("text");
  const [selectionLabel, setSelectionLabel] = useState("");
  const [activeSlotId, setActiveSlotId] = useState<OverlaySlotId | null>(null);
  const [activeSlotTypes, setActiveSlotTypes] = useState<OverlayChangeType[]>([]);

  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState<"share" | "production" | null>(null);

  const variant = variants.find((v) => v.id === selectedVariantId) ?? null;
  const profile = profiles.find((p) => p.id === page.profileId) ?? null;

  const pageDirty = JSON.stringify(page) !== savedPage;
  const dirtyVariantIds = variants
    .filter((v) => savedVariants[v.id] !== variantSnapshot(v))
    .map((v) => v.id);
  const dirty = pageDirty || dirtyVariantIds.length > 0;

  // ---- Esikatselu --------------------------------------------------------------

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
  const variantsRef = useRef(variants);
  const selectedVariantIdRef = useRef(selectedVariantId);
  useEffect(() => {
    variantsRef.current = variants;
    selectedVariantIdRef.current = selectedVariantId;
  }, [variants, selectedVariantId]);
  // Klikkaamalla luodut elementit, jotka poistetaan, jos niihin ei kirjoiteta mitään.
  const draftSlotIdsRef = useRef<Set<string>>(new Set());
  // Sivulla suoraan muokattava elementti (contenteditable iframessa).
  const editingRef = useRef<{ slotId: string; stop: (restore?: boolean) => void; el: Element } | null>(
    null,
  );

  const frameSrc = `/api/overlay/proxy?c=${campaignId}&path=${encodeURIComponent(previewPath)}`;

  const applyPreview = useCallback((changes: OverlayChange[]) => {
    const win = iframeRef.current?.contentWindow as (Window & { __rpOverlay?: OverlayApi }) | null;
    const doc = iframeRef.current?.contentDocument;
    // Sivulla kirjoitettavaa elementtiä ei kosketa, ettei kursori hyppää.
    const editingId = editingRef.current?.slotId;
    const visible = editingId ? changes.filter((c) => c.id !== editingId) : changes;
    if (win?.__rpOverlay && doc) win.__rpOverlay.apply(visible, doc);
    appliedIdsRef.current = new Set(visible.map((c) => c.id as string));
    highlighterRef.current?.refresh();
  }, []);

  // Uudet ja muuttuneet muutokset ajetaan suoraan; poistettu muutos vaatii
  // sivun uudelleenlatauksen, jotta alkuperäinen sisältö palaa.
  useEffect(() => {
    previewChangesRef.current = previewChanges;
    const editingId = editingRef.current?.slotId;
    const ids = new Set(previewChanges.map((c) => c.id as string));
    const removed = [...appliedIdsRef.current].some((id) => id !== editingId && !ids.has(id));
    if (removed) {
      iframeRef.current?.contentWindow?.location.reload();
    } else {
      applyPreview(previewChanges);
    }
  }, [previewChanges, applyPreview]);

  const slotLabelFor = useCallback((el: Element): string => {
    const selector = buildSelector(el);
    return (
      slotsRef.current.find((s) => s.selector === selector)?.label ?? el.tagName.toLowerCase()
    );
  }, []);

  const setValueForSelected = useCallback((slotId: string, value: string) => {
    const variantId = selectedVariantIdRef.current;
    if (!variantId) return;
    setVariants((list) =>
      list.map((v) => (v.id === variantId ? { ...v, values: { ...v.values, [slotId]: value } } : v)),
    );
  }, []);

  /** Poistaa klikkauksella luodut elementit, joihin ei kirjoitettu mitään. */
  const discardEmptyDrafts = useCallback((keep?: string) => {
    const drafts = draftSlotIdsRef.current;
    const empty = [...drafts].filter(
      (id) => id !== keep && variantsRef.current.every((v) => !(v.values[id] ?? "").trim()),
    );
    if (empty.length === 0) return;
    empty.forEach((id) => drafts.delete(id));
    slotsRef.current = slotsRef.current.filter((s) => !empty.includes(s.id));
    setPage((p) => ({ ...p, slots: p.slots.filter((s) => !empty.includes(s.id)) }));
  }, []);

  const stopInlineEdit = useCallback(() => {
    editingRef.current?.stop();
  }, []);

  /** Tekstin muokkaus suoraan sivulla: elementti muuttuu muokattavaksi iframessa. */
  const startInlineEdit = useCallback(
    (el: Element, slot: OverlaySlot, point?: { x: number; y: number }) => {
      stopInlineEdit();
      const target = el as HTMLElement;
      const doc = target.ownerDocument;

      const onInput = () => {
        setValueForSelected(slot.id, target.textContent ?? "");
        highlighterRef.current?.refresh();
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          target.blur();
        }
      };
      const stop = () => {
        target.removeEventListener("input", onInput);
        target.removeEventListener("keydown", onKey);
        target.removeEventListener("blur", stop);
        target.removeAttribute("contenteditable");
        editingRef.current = null;
        // Tyhjäksi jätetty teksti = alkuperäinen sisältö.
        if (!normalizeText(target.textContent)) target.textContent = slot.original;
        applyPreview(previewChangesRef.current);
      };

      target.setAttribute("contenteditable", "plaintext-only");
      target.addEventListener("input", onInput);
      target.addEventListener("keydown", onKey);
      target.addEventListener("blur", stop);
      editingRef.current = { slotId: slot.id, stop, el };
      target.focus({ preventScroll: true });

      // Kursori klikattuun kohtaan, muuten tekstin loppuun.
      const selection = doc.getSelection();
      if (selection) {
        const docWithCaret = doc as Document & {
          caretRangeFromPoint?: (x: number, y: number) => Range | null;
        };
        const range =
          (point && docWithCaret.caretRangeFromPoint?.(point.x, point.y)) || doc.createRange();
        if (!point || !range.startContainer || !target.contains(range.startContainer)) {
          range.selectNodeContents(target);
          range.collapse(false);
        }
        selection.removeAllRanges();
        selection.addRange(range);
      }
    },
    [applyPreview, setValueForSelected, stopInlineEdit],
  );

  const revealRow = useCallback((slotId: string, focusField: boolean) => {
    requestAnimationFrame(() => {
      const row = document.getElementById(`slot-${slotId}`);
      row?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      if (focusField) row?.querySelector<HTMLElement>("textarea, input:not([aria-label='Elementin nimi'])")?.focus();
    });
  }, []);

  /**
   * Klikkaus sivulla: teksti muuttuu heti muokattavaksi ja lisätään
   * personoitaviin automaattisesti. Pelkät säiliöt (vain piilotus) avaavat
   * valintakortin.
   */
  const selectElement = useCallback(
    (el: Element, point?: { x: number; y: number }) => {
      const selector = buildSelector(el);
      const existing = slotsRef.current.find((s) => s.selector === selector);
      discardEmptyDrafts(existing?.id);
      setTab("content");

      if (existing) {
        stopInlineEdit();
        setSelection(null);
        setActiveSlotId(existing.id);
        setActiveSlotTypes(availableTypes(el));
        highlighterRef.current?.select(el, existing.label);
        if (existing.type === "text" && selectedVariantIdRef.current) {
          startInlineEdit(el, existing, point);
          revealRow(existing.id, false);
        } else {
          revealRow(existing.id, true);
        }
        return;
      }

      const types = availableTypes(el);
      const tag = el.tagName.toLowerCase();
      stopInlineEdit();

      if (types[0] === "hide" || !selectedVariantIdRef.current) {
        highlighterRef.current?.select(el, tag);
        setActiveSlotId(null);
        setSelection({
          selector,
          tag,
          types,
          originals: { hide: fingerprintOf(el, "hide") } as Record<OverlayChangeType, string>,
          preview: normalizeText(el.textContent).slice(0, 140),
        });
        setSelectionType("hide");
        setSelectionLabel(suggestLabel(tag, "hide", slotsRef.current));
        return;
      }

      const type = types[0];
      const slot: OverlaySlot = {
        id: nanoid(10) as OverlaySlotId,
        label: suggestLabel(tag, type, slotsRef.current),
        selector,
        type,
        original: fingerprintOf(el, type),
      };
      draftSlotIdsRef.current.add(slot.id);
      slotsRef.current = [...slotsRef.current, slot];
      setPage((p) => ({ ...p, slots: [...p.slots, slot] }));
      setSelection(null);
      setActiveSlotId(slot.id);
      setActiveSlotTypes(types);
      highlighterRef.current?.select(el, slot.label);

      if (type === "text") {
        startInlineEdit(el, slot, point);
        revealRow(slot.id, false);
      } else {
        revealRow(slot.id, true);
      }
    },
    [discardEmptyDrafts, revealRow, startInlineEdit, stopInlineEdit],
  );

  const clearSelection = useCallback(() => {
    stopInlineEdit();
    discardEmptyDrafts();
    setSelection(null);
    setActiveSlotId(null);
    highlighterRef.current?.select(null);
  }, [discardEmptyDrafts, stopInlineEdit]);

  const uploadImage = useCallback(
    async (file: File): Promise<string | null> => {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadSiteAsset(siteId, formData);
      if ("error" in result) {
        showToast(result.error, "error");
        return null;
      }
      return result.url;
    },
    [siteId, showToast],
  );

  /** Kuvatiedosto raahattu suoraan esikatselun kuvan päälle. */
  const dropImage = useCallback(
    async (el: Element, file: File) => {
      selectElement(el);
      const selector = buildSelector(el);
      const slot = slotsRef.current.find((s) => s.selector === selector && s.type === "image");
      if (!slot) return;
      const url = await uploadImage(file);
      if (url) {
        setValueForSelected(slot.id, url);
        showToast("Kuva vaihdettu", "success");
      }
    },
    [selectElement, uploadImage, setValueForSelected, showToast],
  );
  const dropImageRef = useRef(dropImage);
  useEffect(() => {
    dropImageRef.current = dropImage;
  }, [dropImage]);

  const handleFrameLoad = useCallback(() => {
    setFrameLoading(false);
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !doc.body) {
      setFrameError(true);
      return;
    }
    setFrameError(false);
    setSelection(null);
    setActiveSlotId(null);
    editingRef.current = null;

    const highlighter = createFrameHighlighter(doc);
    highlighterRef.current = highlighter;

    doc.addEventListener("mouseover", (e) => {
      const target = e.target as Element | null;
      if (!target || target === doc.body || target === doc.documentElement) {
        highlighter.hover(null);
        return;
      }
      highlighter.hover(target, slotLabelFor(target));
    });
    doc.documentElement.addEventListener("mouseleave", () => highlighter.hover(null));
    doc.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.target as Element | null;
        // Kursorin siirto muokattavan tekstin sisällä ei ole uusi valinta.
        if (target && editingRef.current?.el.contains(target)) return;
        if (target && target !== doc.body && target !== doc.documentElement) {
          selectElement(target, { x: e.clientX, y: e.clientY });
        }
      },
      true,
    );
    doc.addEventListener("submit", (e) => e.preventDefault(), true);
    doc.addEventListener("dragover", (e) => {
      const target = e.target as Element | null;
      if (target?.tagName === "IMG" && e.dataTransfer?.types.includes("Files")) {
        e.preventDefault();
        highlighter.hover(target, "Pudota kuva tähän");
      }
    });
    doc.addEventListener("drop", (e) => {
      e.preventDefault();
      const target = e.target as Element | null;
      const file = e.dataTransfer?.files[0];
      if (target?.tagName === "IMG" && file) dropImageRef.current(target, file);
    });
    doc.addEventListener("keydown", (e) => {
      if (e.key === "Escape") clearSelection();
    });
    doc.defaultView?.addEventListener("scroll", () => highlighter.refresh(), { passive: true });

    applyPreview(previewChangesRef.current);
  }, [applyPreview, selectElement, slotLabelFor, clearSelection]);

  function reloadFrame() {
    setFrameLoading(true);
    iframeRef.current?.contentWindow?.location.reload();
  }

  function openPath(e: React.FormEvent) {
    e.preventDefault();
    const path = pathInput.startsWith("/") ? pathInput : `/${pathInput}`;
    setPathInput(path);
    if (path !== previewPath) {
      setFrameLoading(true);
      setPreviewPath(path);
    }
  }

  function elementForSlot(slot: OverlaySlot): Element | null {
    try {
      return iframeRef.current?.contentDocument?.querySelector(slot.selector) ?? null;
    } catch {
      return null;
    }
  }

  function hoverSlot(slot: OverlaySlot | null) {
    if (!slot) {
      highlighterRef.current?.hover(null);
      return;
    }
    highlighterRef.current?.hover(elementForSlot(slot), slot.label);
  }

  function focusSlot(slot: OverlaySlot) {
    const el = elementForSlot(slot);
    if (!el) {
      showToast(`"${slot.label}" ei löydy tältä sivulta.`, "warning");
      return;
    }
    stopInlineEdit();
    setActiveSlotId(slot.id);
    setActiveSlotTypes(availableTypes(el));
    setSelection(null);
    highlighterRef.current?.select(el, slot.label);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // ---- Elementit ---------------------------------------------------------------

  function addSelectionAsSlot() {
    if (!selection || !selectionLabel.trim()) return;
    const slot: OverlaySlot = {
      id: nanoid(10) as OverlaySlotId,
      label: selectionLabel.trim(),
      selector: selection.selector,
      type: selectionType,
      original: selection.originals[selectionType],
    };
    slotsRef.current = [...slotsRef.current, slot];
    setPage((p) => ({ ...p, slots: [...p.slots, slot] }));
    if (slot.type === "hide") setValueForSelected(slot.id, "1");
    setSelection(null);
    setActiveSlotId(slot.id);
    const el = elementForSlot(slot);
    if (el) highlighterRef.current?.select(el, slot.label);
    // Kohdistus uuden rivin kenttään, jotta sisällön voi kirjoittaa heti.
    requestAnimationFrame(() => {
      const row = document.getElementById(`slot-${slot.id}`);
      row?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      row?.querySelector<HTMLElement>("textarea, input")?.focus();
    });
  }

  function removeSlot(slot: OverlaySlot) {
    if (editingRef.current?.slotId === slot.id) stopInlineEdit();
    draftSlotIdsRef.current.delete(slot.id);
    setPage((p) => ({ ...p, slots: p.slots.filter((s) => s.id !== slot.id) }));
    if (activeSlotId === slot.id) clearSelection();
    showToast(`"${slot.label}" poistettu personoinnista.`, "info");
  }

  /** Tyypin vaihto (esim. teksti → linkki) nollaa elementin arvot, koska ne eivät ole yhteensopivia. */
  function changeSlotType(slot: OverlaySlot, type: OverlayChangeType) {
    const el = elementForSlot(slot);
    if (!el || type === slot.type) return;
    stopInlineEdit();
    setPage((p) => ({
      ...p,
      slots: p.slots.map((s) =>
        s.id === slot.id ? { ...s, type, original: fingerprintOf(el, type) } : s,
      ),
    }));
    setVariants((list) =>
      list.map((v) => {
        const values = { ...v.values };
        delete values[slot.id];
        return { ...v, values };
      }),
    );
  }

  function renameSlot(id: OverlaySlotId, label: string) {
    setPage((p) => ({ ...p, slots: p.slots.map((s) => (s.id === id ? { ...s, label } : s)) }));
  }

  // ---- Variaatiot --------------------------------------------------------------

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
    const result = await createOverlayVariant(landingPageId, {
      name: `Variaatio ${variants.length + 1}`,
    });
    setBusy(false);
    if (!result.success) {
      showToast(result.error, "error");
      return;
    }
    setVariants((list) => [...list, result.data]);
    setSavedVariants((s) => ({ ...s, [result.data.id]: variantSnapshot(result.data) }));
    setSelectedVariantId(result.data.id);
    setTab("content");
  }

  async function savePageIfDirty(): Promise<boolean> {
    if (!pageDirty) return true;
    const result = await saveOverlayLandingPage(landingPageId, page);
    if (!result.success) {
      showToast(result.error, "error");
      return false;
    }
    setSavedPage(JSON.stringify(page));
    return true;
  }

  const handleSave = useCallback(async () => {
    if (!dirty || busy) return;
    setBusy(true);
    try {
      if (!(await savePageIfDirty())) return;
      for (const id of dirtyVariantIds) {
        const v = variants.find((x) => x.id === id);
        if (!v) continue;
        const result = await saveOverlayVariant(v.id, v);
        if (!result.success) {
          showToast(`${v.name}: ${result.error}`, "error");
          return;
        }
        setSavedVariants((s) => ({ ...s, [v.id]: variantSnapshot(v) }));
      }
      showToast("Tallennettu", "success");
    } finally {
      setBusy(false);
    }
    // savePageIfDirty lukee samaa tilaa kuin riippuvuudet alla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, busy, page, variants, dirtyVariantIds, pageDirty]);

  // ⌘S / Ctrl+S tallentaa, Esc poistaa valinnan.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        clearSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave, clearSelection]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  async function handlePersonalize() {
    if (!variant) return;
    setGenerating(true);
    try {
      // AI kirjoittaa tallennettuihin elementteihin tallennetulle profiilille.
      if (!(await savePageIfDirty())) return;
      const result = await personalizeOverlayVariant(landingPageId, { angle: variant.prompt });
      if (!result.success) {
        showToast(result.error, "error");
        return;
      }
      updateVariant({ values: { ...variant.values, ...result.data.values } });
      showToast("Tekstit kirjoitettu — tarkista ja tallenna", "success");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteVariant() {
    if (!variant) return;
    const ok = await showConfirm(`Poistetaanko variaatio "${variant.name}" tilastoineen?`, () => {});
    if (!ok) return;
    setBusy(true);
    const result = await deleteOverlayVariant(variant.id);
    setBusy(false);
    if (!result.success) {
      showToast(result.error, "error");
      return;
    }
    const rest = variants.filter((v) => v.id !== variant.id);
    setVariants(rest);
    setSelectedVariantId(rest[0]?.id ?? null);
    showToast("Variaatio poistettu", "info");
  }

  async function handleDeletePage() {
    const ok = await showConfirm(
      `Poistetaanko laskeutumissivu "${page.name}" ja kaikki sen variaatiot?`,
      () => {},
    );
    if (!ok) return;
    setBusy(true);
    const result = await deleteOverlayLandingPage(landingPageId);
    if (result.success) {
      router.push(backHref);
    } else {
      setBusy(false);
      showToast(result.error, "error");
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

  async function copy(kind: "share" | "production") {
    await navigator.clipboard.writeText(kind === "share" ? shareUrl : productionUrl);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1600);
  }

  const textSlotCount = textSlots(page.slots).length;
  const variantDirty = variant ? dirtyVariantIds.includes(variant.id) : false;

  // ---- Näkymä -------------------------------------------------------------------

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      {/* Yläpalkki */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3 sm:px-4">
        <Link
          href={backHref}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Takaisin kampanjaan"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
          <Link
            href={backHref}
            className="hidden max-w-40 truncate text-muted-foreground hover:text-foreground sm:inline"
          >
            {campaignName}
          </Link>
          <span className="hidden text-muted-foreground/50 sm:inline">/</span>
          <input
            value={page.name}
            onChange={(e) => setPage((p) => ({ ...p, name: e.target.value }))}
            aria-label="Laskeutumissivun nimi"
            className="min-w-0 flex-1 truncate rounded-md bg-transparent px-1.5 py-1 font-semibold outline-none hover:bg-muted focus:bg-muted focus:ring-2 focus:ring-ring sm:max-w-xs"
          />
        </div>
        <span
          className={cn(
            "hidden items-center gap-1.5 text-xs transition-opacity sm:inline-flex",
            dirty ? "text-muted-foreground" : "text-muted-foreground/60",
          )}
          aria-live="polite"
        >
          <span
            className={cn("size-1.5 rounded-full", dirty ? "bg-warning" : "bg-success")}
            aria-hidden
          />
          {busy ? "Tallennetaan…" : dirty ? "Tallentamattomia muutoksia" : "Tallennettu"}
        </span>
        <Button size="sm" onClick={handleSave} disabled={busy || generating || !dirty}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Tallenna
          <kbd className="ml-1 hidden rounded bg-primary-foreground/20 px-1 font-sans text-[10px] font-medium lg:inline">
            ⌘S
          </kbd>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* Paneeli */}
        <aside className="order-2 flex w-full shrink-0 flex-col border-t border-border bg-card lg:order-1 lg:min-h-0 lg:w-[380px] lg:border-r lg:border-t-0">
          {/* Variaatiot */}
          <div className="space-y-3 border-b border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Variaatio
              </span>
              {variants.length > 1 && (
                <span className="text-xs text-muted-foreground">A/B · liikenne jaetaan tasan</span>
              )}
            </div>
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantId(v.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors active:scale-[0.97] motion-reduce:active:scale-100",
                    v.id === selectedVariantId
                      ? "bg-foreground text-background ring-foreground"
                      : "bg-card text-muted-foreground ring-border hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      v.active ? "bg-success" : "bg-muted-foreground/40",
                    )}
                    aria-hidden
                  />
                  {v.name}
                  {savedVariants[v.id] !== variantSnapshot(v) && (
                    <span className="text-warning" aria-label="tallentamaton">•</span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={addVariant}
                disabled={busy}
                aria-label="Uusi variaatio"
                title="Uusi variaatio"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              >
                <Plus className="size-3.5" aria-hidden />
              </button>
            </div>

            {variant && (
              <div className="flex items-center gap-2">
                <input
                  value={variant.name}
                  onChange={(e) => updateVariant({ name: e.target.value })}
                  aria-label="Variaation nimi"
                  className="min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-1 text-sm font-medium outline-none hover:bg-muted focus:bg-muted focus:ring-2 focus:ring-ring"
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={variant.active}
                    onCheckedChange={(active) => updateVariant({ active })}
                    aria-label="Julkaistu"
                  />
                  <StatusPill tone={variant.active ? "live" : "draft"}>
                    {variant.active ? "Julkaistu" : "Luonnos"}
                  </StatusPill>
                </label>
                <IconButton
                  label={copied === "share" ? "Kopioitu" : "Kopioi esikatselulinkki"}
                  onClick={() => copy("share")}
                >
                  {copied === "share" ? <Check className="text-success" /> : <Copy />}
                </IconButton>
                <IconButton label="Avaa esikatselu" onClick={() => window.open(shareUrl, "_blank", "noopener")}>
                  <ExternalLink />
                </IconButton>
                <IconButton
                  label="Poista variaatio"
                  onClick={handleDeleteVariant}
                  disabled={busy}
                  className="hover:text-destructive"
                >
                  <Trash2 />
                </IconButton>
              </div>
            )}
            {variantDirty && (
              <p className="text-xs text-muted-foreground">
                Esikatselulinkki näyttää tallennetun version.
              </p>
            )}
          </div>

          <div className="px-4 pt-3">
            <SegmentedControl
              ariaLabel="Paneelin näkymä"
              value={tab}
              onChange={setTab}
              options={[
                { value: "content", label: `Sisältö${page.slots.length ? ` · ${page.slots.length}` : ""}` },
                { value: "targeting", label: "Kohdennus" },
              ]}
            />
          </div>

          <div className="p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {tab === "content" ? (
              <div className="space-y-5">
                {/* AI */}
                {variant && (
                  <section className="rounded-xl border border-border bg-gradient-to-b from-accent/60 to-card p-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" aria-hidden />
                      <h2 className="text-sm font-semibold">Personoi AI:lla</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab("targeting")}
                      className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-inset ring-border hover:text-foreground"
                    >
                      <UserRound className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">
                        {profile ? profile.name : "Ei profiilia — valitse kohderyhmä"}
                      </span>
                    </button>
                    {showPrompt || variant.prompt ? (
                      <AutoTextarea
                        value={variant.prompt}
                        onChange={(e) => updateVariant({ prompt: e.target.value })}
                        placeholder="Kulma tälle variaatiolle, esim. Selkeämpi ja yksinkertaisempi – korosta ajansäästöä."
                        className="mt-3 bg-card text-sm"
                        autoFocus={showPrompt && !variant.prompt}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowPrompt(true)}
                        className="mt-3 block text-xs font-medium text-primary hover:underline"
                      >
                        + Lisää ohje AI:lle
                      </button>
                    )}
                    <Button
                      size="sm"
                      onClick={handlePersonalize}
                      disabled={generating || busy || textSlotCount === 0}
                      className="mt-3 w-full"
                    >
                      {generating ? (
                        <Loader2 className="animate-spin" aria-hidden />
                      ) : (
                        <Sparkles aria-hidden />
                      )}
                      {generating
                        ? "Kirjoitetaan…"
                        : textSlotCount === 0
                          ? "Lisää ensin tekstielementti"
                          : `Kirjoita ${textSlotCount} ${textSlotCount === 1 ? "teksti" : "tekstiä"}`}
                    </Button>
                  </section>
                )}

                {/* Valittu, vielä personoimaton elementti */}
                {selection && (
                  <section className="space-y-3 rounded-xl border-2 border-primary/40 bg-card p-4 shadow-sm overlay-pop">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Valittu &lt;{selection.tag}&gt;
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm">
                          {selection.preview || <span className="text-muted-foreground">Ei tekstiä</span>}
                        </p>
                      </div>
                      <IconButton label="Poista valinta (Esc)" onClick={clearSelection}>
                        <span aria-hidden className="text-lg leading-none">×</span>
                      </IconButton>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tässä osiossa ei ole suoraan muokattavaa tekstiä. Voit piilottaa sen tältä
                      variaatiolta — tai klikata tarkemmin itse tekstiä tai kuvaa.
                    </p>
                    <div className="space-y-1">
                      <Label htmlFor="selection-label" className="text-xs text-muted-foreground">
                        Nimi
                      </Label>
                      <Input
                        id="selection-label"
                        value={selectionLabel}
                        onChange={(e) => setSelectionLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSelectionAsSlot()}
                        className="h-8"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={addSelectionAsSlot}
                      disabled={!selectionLabel.trim() || !variant}
                    >
                      <EyeOff aria-hidden />
                      Piilota tässä variaatiossa
                    </Button>
                  </section>
                )}

                {/* Personoidut elementit */}
                {page.slots.length === 0 && !selection ? (
                  <div className="flex flex-col items-center px-4 py-10 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
                      <MousePointerClick className="size-6" aria-hidden />
                    </span>
                    <p className="mt-4 text-sm font-semibold">Klikkaa sivulta ja kirjoita</p>
                    <p className="mt-1 max-w-64 text-sm text-muted-foreground">
                      Klikkaa mitä tahansa tekstiä ja kirjoita suoraan sen päälle. Kuvan voit
                      vaihtaa raahaamalla tiedoston sen päälle.
                    </p>
                  </div>
                ) : (
                  page.slots.length > 0 && (
                    <section>
                      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Personoidut elementit
                      </h2>
                      <ul className="space-y-2">
                        {page.slots.map((slot) => {
                          const Icon = TYPE_META[slot.type].icon;
                          const value = variant?.values[slot.id] ?? "";
                          const active = activeSlotId === slot.id;
                          const changed = slot.type === "hide" ? value === "1" : Boolean(value.trim()) && value !== slot.original;
                          return (
                            <li
                              key={slot.id}
                              id={`slot-${slot.id}`}
                              onMouseEnter={() => hoverSlot(slot)}
                              onMouseLeave={() => hoverSlot(null)}
                              className={cn(
                                "group rounded-xl border bg-card p-3 transition-shadow",
                                active
                                  ? "border-primary/50 shadow-sm ring-2 ring-primary/20"
                                  : "border-border hover:border-foreground/20",
                              )}
                            >
                              <div className="flex items-center gap-1.5">
                                <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                                <input
                                  value={slot.label}
                                  onChange={(e) => renameSlot(slot.id, e.target.value)}
                                  aria-label="Elementin nimi"
                                  className="min-w-0 flex-1 truncate rounded bg-transparent px-1 text-xs font-semibold outline-none hover:bg-muted focus:bg-muted focus:ring-2 focus:ring-ring"
                                />
                                {changed && (
                                  <span className="size-1.5 shrink-0 rounded-full bg-primary" title="Personoitu tässä variaatiossa" />
                                )}
                                <div className="flex opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                                  <IconButton label="Näytä sivulla" onClick={() => focusSlot(slot)} className="size-7">
                                    <Crosshair />
                                  </IconButton>
                                  <IconButton
                                    label="Poista personoinnista"
                                    onClick={() => removeSlot(slot)}
                                    className="size-7 hover:text-destructive"
                                  >
                                    <Trash2 />
                                  </IconButton>
                                </div>
                              </div>
                              {active && activeSlotTypes.length > 1 && (
                                <SegmentedControl
                                  size="sm"
                                  className="mt-2"
                                  ariaLabel="Muutoksen tyyppi"
                                  value={slot.type}
                                  onChange={(type) => changeSlotType(slot, type)}
                                  options={activeSlotTypes.map((t) => {
                                    const TypeIcon = TYPE_META[t].icon;
                                    return {
                                      value: t,
                                      label: (
                                        <>
                                          <TypeIcon className="size-3.5" aria-hidden />
                                          {TYPE_META[t].label}
                                        </>
                                      ),
                                    };
                                  })}
                                />
                              )}
                              {variant && (
                                <div className="mt-2">
                                  {slot.type === "hide" ? (
                                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Switch
                                        checked={value === "1"}
                                        onCheckedChange={(on) => setSlotValue(slot.id, on ? "1" : "")}
                                      />
                                      Piilota tässä variaatiossa
                                    </label>
                                  ) : slot.type === "text" ? (
                                    <AutoTextarea
                                      value={value}
                                      onChange={(e) => setSlotValue(slot.id, e.target.value)}
                                      onFocus={() => {
                                        setActiveSlotId(slot.id);
                                        highlighterRef.current?.select(elementForSlot(slot), slot.label);
                                      }}
                                      placeholder={slot.original}
                                      disabled={generating}
                                      className={cn(
                                        "text-sm",
                                        generating && "animate-pulse motion-reduce:animate-none",
                                      )}
                                    />
                                  ) : slot.type === "image" ? (
                                    <ImageSlotField
                                      value={value}
                                      original={slot.original}
                                      baseUrl={new URL(previewPath, targetOrigin).toString()}
                                      onChange={(url) => setSlotValue(slot.id, url)}
                                      upload={uploadImage}
                                      disabled={generating}
                                    />
                                  ) : (
                                    <Input
                                      value={value}
                                      onChange={(e) => setSlotValue(slot.id, e.target.value)}
                                      onFocus={() => setActiveSlotId(slot.id)}
                                      placeholder={slot.original}
                                      className="h-8 text-sm"
                                    />
                                  )}
                                  {changed && (slot.type === "text" || slot.type === "link") && (
                                    <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground" title={slot.original}>
                                      Alkuperäinen: {slot.original}
                                    </p>
                                  )}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <section className="space-y-2">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Kohderyhmä
                  </h2>
                  <select
                    value={page.profileId ?? ""}
                    onChange={(e) => setPage((p) => ({ ...p, profileId: e.target.value || null }))}
                    aria-label="Kohderyhmäprofiili"
                    className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm"
                  >
                    <option value="">Ei profiilia (yrityksen ihanneasiakas)</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {profile?.description && (
                    <p className="line-clamp-4 whitespace-pre-line rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                      {profile.description}
                    </p>
                  )}
                  <Link
                    href={`/app/dashboard/${siteId}/overlay/profiles`}
                    className="inline-block text-xs font-medium text-primary hover:underline"
                  >
                    Hallitse profiileja
                  </Link>
                </section>

                <section className="space-y-3">
                  <div>
                    <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Milloin näytetään
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Kaikkien täytettyjen ehtojen pitää täsmätä. Tyhjä = kaikki kävijät.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="path-pattern" className="text-xs">
                      Sivun polku <span className="text-muted-foreground">(* = mikä tahansa)</span>
                    </Label>
                    <Input
                      id="path-pattern"
                      value={page.pathPattern}
                      onChange={(e) => setPage((p) => ({ ...p, pathPattern: e.target.value }))}
                      className="h-8"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                  </div>
                </section>

                <section className="space-y-2">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Mainoslinkki
                  </h2>
                  <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
                    <code className="min-w-0 flex-1 break-all text-xs">{productionUrl}</code>
                    <IconButton label="Kopioi mainoslinkki" onClick={() => copy("production")} className="size-7">
                      {copied === "production" ? <Check className="text-success" /> : <Copy />}
                    </IconButton>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Toimii, kun snippet on asennettu asiakkaan sivulle ja variaatio on julkaistu.
                  </p>
                </section>

                <section className="border-t border-border pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeletePage}
                    disabled={busy}
                    className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 aria-hidden />
                    Poista laskeutumissivu
                  </Button>
                </section>
              </div>
            )}
          </div>
        </aside>

        {/* Kangas */}
        <main className="relative order-1 flex h-[60vh] min-w-0 shrink-0 flex-col bg-muted/60 lg:order-2 lg:h-auto lg:min-h-0 lg:flex-1">
          {/* Kelluva työkalurivi */}
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
            <div className="pointer-events-auto flex w-full max-w-2xl items-center gap-1 rounded-xl border border-border/60 bg-card/80 p-1 shadow-lg shadow-black/5 backdrop-blur-xl backdrop-saturate-150">
              <form onSubmit={openPath} className="flex min-w-0 flex-1 items-center rounded-lg bg-muted/70 pl-2.5">
                <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">
                  {targetOrigin.replace(/^https?:\/\//, "")}
                </span>
                <input
                  value={pathInput}
                  onChange={(e) => setPathInput(e.target.value)}
                  aria-label="Esikatseltava polku"
                  className="h-8 min-w-0 flex-1 bg-transparent px-1 text-xs outline-none"
                />
              </form>
              <IconButton label="Lataa uudelleen" onClick={reloadFrame}>
                <RotateCw className={cn(frameLoading && "animate-spin motion-reduce:animate-none")} />
              </IconButton>
              <SegmentedControl
                size="sm"
                ariaLabel="Laitekoko"
                value={device}
                onChange={setDevice}
                className="hidden sm:flex"
                options={[
                  { value: "desktop", label: <Monitor className="size-3.5" aria-label="Työpöytä" />, title: "Työpöytä" },
                  { value: "tablet", label: <Tablet className="size-3.5" aria-label="Tabletti" />, title: "Tabletti" },
                  { value: "mobile", label: <Smartphone className="size-3.5" aria-label="Mobiili" />, title: "Mobiili" },
                ]}
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 justify-center overflow-hidden px-3 pb-3 pt-[4.25rem]">
            <div
              className={cn(
                "relative h-full overflow-hidden bg-white shadow-xl shadow-black/10 ring-1 ring-border transition-[width,border-radius] duration-300 ease-out motion-reduce:transition-none",
                device === "desktop" ? "rounded-lg" : "rounded-[1.75rem]",
              )}
              style={{ width: DEVICE_WIDTH[device], maxWidth: "100%" }}
            >
              <iframe
                key={frameSrc}
                ref={iframeRef}
                src={frameSrc}
                onLoad={handleFrameLoad}
                className="size-full"
                title="Sivun esikatselu"
              />
              {frameLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/70 backdrop-blur-sm transition-opacity">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Ladataan sivua" />
                </div>
              )}
              {frameError && !frameLoading && (
                <div className="absolute inset-x-0 top-0 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  Sivun lataus epäonnistui. Tarkista osoite tai lataa uudelleen.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
