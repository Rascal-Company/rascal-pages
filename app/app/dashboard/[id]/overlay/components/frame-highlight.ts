/**
 * Korostuslaatikot editorin iframeen. Yksi hover- ja yksi valintalaatikko,
 * jotka liukuvat elementistä toiseen (transform), sen sijaan että jokaiselle
 * elementille lisättäisiin outline — liike kertoo, mihin valinta siirtyi.
 */

const STYLE = `
.__rp-box{position:absolute;top:0;left:0;pointer-events:none;z-index:2147483646;border-radius:6px;
  transition:transform .14s cubic-bezier(.2,.8,.2,1),width .14s cubic-bezier(.2,.8,.2,1),height .14s cubic-bezier(.2,.8,.2,1),opacity .12s ease-out}
.__rp-hover{border:1.5px dashed rgba(232,123,78,.9);background:rgba(232,123,78,.06)}
.__rp-selected{border:2px solid rgb(232,123,78);background:rgba(232,123,78,.10);box-shadow:0 0 0 4px rgba(232,123,78,.15)}
.__rp-label{position:absolute;left:-2px;bottom:calc(100% + 6px);white-space:nowrap;max-width:280px;overflow:hidden;text-overflow:ellipsis;
  font:600 11px/1.4 system-ui,-apple-system,sans-serif;letter-spacing:.01em;color:#fff;background:rgb(232,123,78);
  padding:3px 8px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.18)}
.__rp-hover .__rp-label{background:rgba(26,26,26,.85)}
.__rp-box[data-below] .__rp-label{bottom:auto;top:calc(100% + 6px)}
html{cursor:default}
@media (prefers-reduced-motion:reduce){.__rp-box{transition:opacity .12s ease-out}}`;

export type FrameHighlighter = {
  hover: (el: Element | null, label?: string) => void;
  select: (el: Element | null, label?: string) => void;
  refresh: () => void;
};

export function createFrameHighlighter(doc: Document): FrameHighlighter {
  const style = doc.createElement("style");
  style.textContent = STYLE;
  doc.head?.appendChild(style);

  function makeBox(kind: "hover" | "selected") {
    const box = doc.createElement("div");
    box.className = `__rp-box __rp-${kind}`;
    box.style.opacity = "0";
    const label = doc.createElement("span");
    label.className = "__rp-label";
    box.appendChild(label);
    doc.body.appendChild(box);
    return { box, label, target: null as Element | null };
  }

  const hoverBox = makeBox("hover");
  const selectedBox = makeBox("selected");

  function place(state: ReturnType<typeof makeBox>) {
    const el = state.target;
    if (!el || !el.isConnected) {
      state.box.style.opacity = "0";
      return;
    }
    const rect = el.getBoundingClientRect();
    const win = doc.defaultView!;
    const pad = 3;
    state.box.style.width = `${rect.width + pad * 2}px`;
    state.box.style.height = `${rect.height + pad * 2}px`;
    state.box.style.transform = `translate(${rect.left + win.scrollX - pad}px, ${rect.top + win.scrollY - pad}px)`;
    state.box.toggleAttribute("data-below", rect.top < 32);
    state.box.style.opacity = "1";
  }

  function set(state: ReturnType<typeof makeBox>, el: Element | null, label?: string) {
    state.target = el;
    state.label.textContent = label ?? (el ? el.tagName.toLowerCase() : "");
    place(state);
  }

  const refresh = () => {
    place(hoverBox);
    place(selectedBox);
  };
  doc.defaultView?.addEventListener("resize", refresh);

  return {
    hover: (el, label) => set(hoverBox, el === selectedBox.target ? null : el, label),
    select: (el, label) => {
      set(selectedBox, el, label);
      if (el) set(hoverBox, null);
    },
    refresh,
  };
}
