"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
import { deleteOverlayVariant, saveOverlayVariant } from "@/app/actions/overlay";
import type { SiteId } from "@/src/lib/types";
import {
  OVERLAY_MATCH_KEYS,
  type OverlayChange,
  type OverlayChangeId,
  type OverlayChangeType,
  type OverlayMatch,
  type OverlayVariantId,
} from "@/src/lib/overlay";
import {
  buildSelector,
  canEditText,
  fingerprintOf,
  normalizeText,
} from "@/src/lib/overlay-selector";

type VariantState = {
  name: string;
  pathPattern: string;
  match: OverlayMatch;
  changes: OverlayChange[];
  active: boolean;
};

type Selection = {
  selector: string;
  tag: string;
  types: OverlayChangeType[];
  current: Record<OverlayChangeType, string>;
  originals: Record<OverlayChangeType, string>;
};

type OverlayApi = { apply: (changes: OverlayChange[], doc?: Document) => number };

const TYPE_LABELS: Record<OverlayChangeType, string> = {
  text: "Teksti",
  image: "Kuva",
  link: "Linkki",
  hide: "Piilota",
};

const MATCH_LABELS: Record<(typeof OVERLAY_MATCH_KEYS)[number], string> = {
  utm_campaign: "utm_campaign",
  utm_content: "utm_content (creative)",
  rp: "rp (oma tunniste)",
};

const EDITOR_STYLE = `
.__rp-hover{outline:2px dashed #6366f1!important;outline-offset:2px!important;cursor:pointer!important}
.__rp-selected{outline:3px solid #6366f1!important;outline-offset:2px!important}`;

function availableTypes(el: Element): OverlayChangeType[] {
  const types: OverlayChangeType[] = [];
  if (canEditText(el)) types.push("text");
  if (el.tagName === "IMG") types.push("image");
  const link = el.tagName === "A" && el.hasAttribute("href");
  if (link) types.push("link");
  types.push("hide");
  return types;
}

export default function OverlayEditor({
  siteId,
  variantId,
  targetOrigin,
  appOrigin,
  previewToken,
  initial,
}: {
  siteId: SiteId;
  variantId: OverlayVariantId;
  targetOrigin: string;
  appOrigin: string;
  previewToken: string;
  initial: VariantState;
}) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<VariantState>(initial);
  const [saved, setSaved] = useState<VariantState>(initial);
  const [previewPath, setPreviewPath] = useState(
    initial.pathPattern.includes("*") ? "/" : initial.pathPattern,
  );
  const [pathInput, setPathInput] = useState(previewPath);
  const [frameKey, setFrameKey] = useState(0);
  const [frameError, setFrameError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [activeType, setActiveType] = useState<OverlayChangeType>("text");
  const [draftValue, setDraftValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Iframen kuuntelijat lukevat muutokset refistä, jotta ne eivät vanhene.
  const changesRef = useRef(state.changes);
  useEffect(() => {
    changesRef.current = state.changes;
  }, [state.changes]);

  const dirty = useMemo(() => JSON.stringify(state) !== JSON.stringify(saved), [state, saved]);

  const frameSrc = `/api/overlay/proxy?v=${variantId}&path=${encodeURIComponent(previewPath)}`;

  const applyPreview = useCallback((changes: OverlayChange[]) => {
    const win = iframeRef.current?.contentWindow as (Window & { __rpOverlay?: OverlayApi }) | null;
    const doc = iframeRef.current?.contentDocument;
    if (win?.__rpOverlay && doc) win.__rpOverlay.apply(changes, doc);
  }, []);

  const selectElement = useCallback((el: Element) => {
    const doc = el.ownerDocument;
    doc.querySelectorAll(".__rp-selected").forEach((n) => n.classList.remove("__rp-selected"));
    el.classList.add("__rp-selected");
    el.classList.remove("__rp-hover");

    const selector = buildSelector(el);
    const types = availableTypes(el);
    const existing = changesRef.current.filter((c) => c.selector === selector);

    const current = {} as Record<OverlayChangeType, string>;
    const originals = {} as Record<OverlayChangeType, string>;
    for (const type of types) {
      const change = existing.find((c) => c.type === type);
      // Jos elementtiä on jo muokattu esikatselussa, alkuperäinen sormenjälki
      // otetaan tallennetusta muutoksesta eikä muokatusta DOMista.
      originals[type] = change?.original ?? fingerprintOf(el, type);
      current[type] =
        type === "text"
          ? normalizeText(el.textContent)
          : type === "image"
            ? (el.getAttribute("src") ?? "")
            : type === "link"
              ? (el.getAttribute("href") ?? "")
              : "";
    }

    const first = types[0];
    setSelection({ selector, tag: el.tagName.toLowerCase(), types, current, originals });
    setActiveType(first);
    setDraftValue(current[first]);
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

    applyPreview(changesRef.current);
  }, [applyPreview, selectElement]);

  // Ladataan iframe uudelleen, kun muutos poistetaan (alkuperäinen sisältö takaisin).
  const reloadFrame = () => setFrameKey((k) => k + 1);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function upsertChange() {
    if (!selection) return;
    const value = activeType === "hide" ? "" : draftValue.trim();
    if (activeType !== "hide" && !value) return;

    const existing = state.changes.find(
      (c) => c.selector === selection.selector && c.type === activeType,
    );
    const change: OverlayChange = {
      id: existing?.id ?? (nanoid(10) as OverlayChangeId),
      selector: selection.selector,
      type: activeType,
      value,
      original: selection.originals[activeType],
    };
    const changes = existing
      ? state.changes.map((c) => (c.id === existing.id ? change : c))
      : [...state.changes, change];

    setState((s) => ({ ...s, changes }));
    applyPreview(changes);
  }

  function removeChange(id: OverlayChangeId) {
    setState((s) => ({ ...s, changes: s.changes.filter((c) => c.id !== id) }));
    reloadFrame();
  }

  async function handleSave() {
    setBusy(true);
    setMessage(null);
    const result = await saveOverlayVariant(variantId, state);
    setBusy(false);
    if (result.success) {
      setSaved(state);
      setMessage({ kind: "ok", text: "Tallennettu." });
    } else {
      setMessage({ kind: "error", text: result.error });
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    const result = await deleteOverlayVariant(variantId);
    if (result.success) {
      router.push(`/app/dashboard/${siteId}/overlay`);
    } else {
      setBusy(false);
      setMessage({ kind: "error", text: result.error });
    }
  }

  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => {
    const url = new URL("/api/overlay/preview", appOrigin);
    url.searchParams.set("t", previewToken);
    url.searchParams.set("path", previewPath);
    return url.toString();
  }, [appOrigin, previewToken, previewPath]);

  async function copyShareUrl() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const productionUrl = useMemo(() => {
    const url = new URL(previewPath, targetOrigin);
    for (const key of OVERLAY_MATCH_KEYS) {
      const value = state.match[key];
      if (value) url.searchParams.set(key, value);
    }
    return url.toString();
  }, [previewPath, targetOrigin, state.match]);

  const selectedChange = selection
    ? state.changes.find((c) => c.selector === selection.selector && c.type === activeType)
    : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-brand-light lg:h-screen">
      {/* Yläpalkki */}
      <header className="flex flex-wrap items-center gap-3 border-b border-brand-dark/10 bg-card px-4 py-3">
        <Link
          href={`/app/dashboard/${siteId}/overlay`}
          className="text-sm text-brand-dark/70 hover:text-brand-dark"
        >
          ← Variantit
        </Link>
        <Input
          value={state.name}
          onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
          className="h-8 min-w-0 flex-1 font-medium sm:max-w-xs"
          aria-label="Variantin nimi"
        />
        <label className="flex items-center gap-2 text-sm text-brand-dark/80">
          <Switch
            checked={state.active}
            onCheckedChange={(active) => setState((s) => ({ ...s, active }))}
          />
          {state.active ? "Julkaistu" : "Luonnos"}
        </label>
        <div className="ml-auto flex items-center gap-2">
          {message && (
            <span className={`text-sm ${message.kind === "ok" ? "text-green-700" : "text-red-600"}`}>
              {message.text}
            </span>
          )}
          <Button size="sm" onClick={handleSave} disabled={busy || !dirty}>
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
          {frameError && (
            <p className="bg-red-50 px-4 py-2 text-sm text-red-700">{frameError}</p>
          )}
          <iframe
            key={`${frameSrc}-${frameKey}`}
            ref={iframeRef}
            src={frameSrc}
            onLoad={handleFrameLoad}
            className="min-h-0 w-full flex-1 bg-white"
            title="Sivun esikatselu"
          />
        </div>

        {/* Sivupaneeli */}
        <aside className="w-full shrink-0 space-y-6 overflow-y-auto border-t border-brand-dark/10 bg-card p-4 lg:w-96 lg:border-l lg:border-t-0">
          <section>
            <h2 className="text-sm font-semibold text-brand-dark">Valittu elementti</h2>
            {!selection ? (
              <p className="mt-2 text-sm text-brand-dark/60">
                Klikkaa esikatselussa tekstiä, kuvaa tai linkkiä, jota haluat muuttaa.
              </p>
            ) : (
              <div className="mt-2 space-y-3">
                <code className="block break-all rounded bg-brand-light px-2 py-1 text-xs text-brand-dark/70">
                  &lt;{selection.tag}&gt; {selection.selector}
                </code>
                <div className="flex flex-wrap gap-1">
                  {selection.types.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setActiveType(type);
                        setDraftValue(selection.current[type]);
                      }}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                        activeType === type
                          ? "bg-primary text-primary-foreground"
                          : "bg-brand-light text-brand-dark/80 hover:bg-brand-dark/10"
                      }`}
                    >
                      {TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
                {!selection.types.includes("text") && selection.types.length === 1 && (
                  <p className="text-xs text-brand-dark/60">
                    Tekstiä voi muokata vain elementistä, jonka sisällä ei ole muita
                    elementtejä — klikkaa tarkemmin itse tekstiä.
                  </p>
                )}

                {activeType === "hide" ? (
                  <p className="text-sm text-brand-dark/70">
                    Elementti piilotetaan tämän variantin kävijöiltä.
                  </p>
                ) : activeType === "text" ? (
                  <Textarea
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value)}
                    rows={4}
                  />
                ) : (
                  <Input
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value)}
                    placeholder="https://"
                  />
                )}
                <Button size="sm" onClick={upsertChange} className="w-full">
                  {selectedChange ? "Päivitä muutos" : "Lisää muutos"}
                </Button>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-brand-dark">
              Muutokset ({state.changes.length})
            </h2>
            {state.changes.length === 0 ? (
              <p className="mt-2 text-sm text-brand-dark/60">Ei vielä muutoksia.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {state.changes.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start gap-2 rounded-md border border-brand-dark/10 p-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-brand-dark/60">{TYPE_LABELS[c.type]}</p>
                      <p className="truncate text-sm text-brand-dark">
                        {c.type === "hide" ? c.original : c.value}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeChange(c.id)}
                      className="shrink-0 text-xs text-red-600 hover:underline"
                    >
                      Poista
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-brand-dark">Kohdennus</h2>
              <p className="mt-1 text-xs text-brand-dark/60">
                Variantti näytetään, kun kaikki täytetyt parametrit täsmäävät. Tyhjä =
                kaikki kävijät.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="path-pattern" className="text-xs">
                Sivun polku (* = mikä tahansa)
              </Label>
              <Input
                id="path-pattern"
                value={state.pathPattern}
                onChange={(e) => setState((s) => ({ ...s, pathPattern: e.target.value }))}
                className="h-8"
              />
            </div>
            {OVERLAY_MATCH_KEYS.map((key) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={`match-${key}`} className="text-xs">
                  {MATCH_LABELS[key]}
                </Label>
                <Input
                  id={`match-${key}`}
                  value={state.match[key] ?? ""}
                  onChange={(e) =>
                    setState((s) => ({ ...s, match: { ...s.match, [key]: e.target.value } }))
                  }
                  className="h-8"
                />
              </div>
            ))}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-brand-dark">1. Esikatselulinkki</h2>
            <p className="mt-1 text-xs text-brand-dark/60">
              Toimii heti — ei vaadi snippetiä, kirjautumista eikä julkaisua. Jaa
              asiakkaalle tai myyjälle. Näyttää tallennetut muutokset.
            </p>
            {dirty && (
              <p className="mt-1 text-xs font-medium text-amber-700">
                Tallenna, jotta uusimmat muutokset näkyvät linkissä.
              </p>
            )}
            <code className="mt-2 block break-all rounded bg-brand-light px-2 py-1 text-xs text-brand-dark/80">
              {shareUrl}
            </code>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={copyShareUrl} disabled={!shareUrl}>
                {copied ? "Kopioitu" : "Kopioi"}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  Avaa
                </a>
              </Button>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-brand-dark">2. Tuotantolinkki mainokseen</h2>
            <p className="mt-1 text-xs text-brand-dark/60">
              Asiakkaan oikea sivu. Toimii, kun snippet on asennettu ja variantti
              julkaistu.
            </p>
            <code className="mt-2 block break-all rounded bg-brand-light px-2 py-1 text-xs text-brand-dark/80">
              {productionUrl}
            </code>
          </section>

          <section className="border-t border-brand-dark/10 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={busy}
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
            >
              {confirmDelete ? "Vahvista poisto" : "Poista variantti"}
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
