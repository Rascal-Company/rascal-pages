"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const FRAME_DOC =
  '<!doctype html><html lang="fi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="rp-preview-root"></div></body></html>';

/** Kopioi sovelluksen tyylit iframeen ja pitää ne synkronissa (dev-tilan HMR lisää style-tageja). */
function mirrorStyles(target: Document): () => void {
  const copied = new Map<Node, Node>();

  const sync = () => {
    const current = new Set<Node>();
    document.head
      .querySelectorAll('style, link[rel="stylesheet"]')
      .forEach((node) => {
        current.add(node);
        const existing = copied.get(node);
        if (!existing) {
          const clone = node.cloneNode(true);
          target.head.appendChild(clone);
          copied.set(node, clone);
        } else if (node.nodeName === "STYLE" && existing.textContent !== node.textContent) {
          existing.textContent = node.textContent;
        }
      });
    for (const [source, clone] of copied) {
      if (!current.has(source)) {
        clone.parentNode?.removeChild(clone);
        copied.delete(source);
      }
    }
  };

  sync();
  const observer = new MutationObserver(sync);
  observer.observe(document.head, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}

/**
 * Renderöi lapset omaan iframeen React-portaalilla. Sivu saa näin oman
 * näkymänsä: Tailwindin breakpointit, min-h-screen ja sticky-otsikot
 * käyttäytyvät kuten oikealla laitteella, vaikka tila ja tapahtumat pysyvät
 * editorin React-puussa.
 */
export default function PreviewFrame({
  children,
  title,
  className,
}: {
  children: React.ReactNode;
  title: string;
  className?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let cleanup: (() => void) | undefined;

    const setup = () => {
      const doc = iframe.contentDocument;
      const root = doc?.getElementById("rp-preview-root");
      if (!doc || !root) return;
      // Fonttimuuttujat (next/font) ja antialiasointi samoina kuin sovelluksessa.
      doc.body.className = document.body.className;
      doc.body.style.margin = "0";
      cleanup = mirrorStyles(doc);
      setMountNode(root);
    };

    if (iframe.contentDocument?.readyState === "complete" && iframe.contentDocument.getElementById("rp-preview-root")) {
      setup();
    } else {
      iframe.addEventListener("load", setup, { once: true });
    }
    return () => {
      iframe.removeEventListener("load", setup);
      cleanup?.();
    };
  }, []);

  return (
    <iframe ref={iframeRef} title={title} srcDoc={FRAME_DOC} className={className}>
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
}
