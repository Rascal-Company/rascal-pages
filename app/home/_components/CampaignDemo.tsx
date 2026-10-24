"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import styles from "../home.module.css";

type Campaign = {
  id: string;
  label: string;
  param: string | null;
  title: string;
  body: string;
  cta: string;
};

// Kuvitteellinen asiakas. Sama sivu, kolme mainosta: kävijä näkee version,
// jonka mainosta hän klikkasi (overlayn utm_campaign-kohdennus).
const CAMPAIGNS: Campaign[] = [
  {
    id: "default",
    label: "Ei mainosta",
    param: null,
    title: "Pilatesta Kalliossa, pienissä ryhmissä",
    body: "Tunteja aamusta iltaan. Ryhmässä on enintään kahdeksan osallistujaa.",
    cta: "Katso tunnit",
  },
  {
    id: "kevat",
    label: "Kevätkampanja",
    param: "utm_campaign=kevat",
    title: "Aloita keväällä: kolme tuntia 39 eurolla",
    body: "Aloituspaketti uusille asiakkaille. Voimassa toukokuun loppuun.",
    cta: "Varaa aloituspaketti",
  },
  {
    id: "yritys",
    label: "Yrityksille",
    param: "utm_campaign=yritys",
    title: "Pilatestunnit teidän työpaikallenne",
    body: "Ohjaaja tulee toimistollenne, tai varaatte studion koko tiimille.",
    cta: "Pyydä tarjous",
  },
];

export default function CampaignDemo() {
  const [index, setIndex] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const active = CAMPAIGNS[index];

  const select = (next: number) => {
    const wrapped = (next + CAMPAIGNS.length) % CAMPAIGNS.length;
    setIndex(wrapped);
    buttons.current[wrapped]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      select(index + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      select(index - 1);
    }
  };

  return (
    <figure className="m-0">
      <div
        role="radiogroup"
        aria-label="Valitse mainos, josta kävijä tulee"
        className={`${styles.segmented} mb-4`}
        onKeyDown={onKeyDown}
      >
        <span
          aria-hidden
          className={styles.segmentIndicator}
          style={{
            width: `calc((100% - 8px) / ${CAMPAIGNS.length})`,
            transform: `translateX(${index * 100}%)`,
          }}
        />
        {CAMPAIGNS.map((c, i) => (
          <button
            key={c.id}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={i === index}
            tabIndex={i === index ? 0 : -1}
            // Valinta painalluksessa, ei vasta vapautuksessa.
            onPointerDown={(e) => {
              if (e.button === 0) setIndex(i);
            }}
            onClick={() => setIndex(i)}
            className={styles.segment}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className={styles.browser}>
        <div className={styles.browserBar}>
          <div className={styles.dots} aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.url} aria-label="Sivun osoite">
            studiolumo.fi
            {active.param && (
              <span key={active.id} className={`${styles.urlParam} ${styles.swapIn}`}>
                /?{active.param}
              </span>
            )}
          </div>
        </div>

        <div className="px-6 pb-8 pt-6 sm:px-10 sm:pb-12 sm:pt-8">
          <div className="mb-10 flex items-center justify-between text-sm" aria-hidden>
            <span className="font-semibold tracking-tight">Studio Lumo</span>
            <span className="hidden gap-5 text-[color:var(--ink-muted)] sm:flex">
              <span>Tunnit</span>
              <span>Hinnat</span>
              <span>Yhteystiedot</span>
            </span>
          </div>

          {/* Kiinteä vähimmäiskorkeus: versiot ovat eri pituisia, eikä hero saa hyppiä. */}
          <div key={active.id} className={`${styles.swapIn} min-h-[13.5rem] sm:min-h-[14.5rem]`} aria-live="polite">
            <p
              className={`${styles.selected} text-[1.625rem] font-semibold leading-[1.12] tracking-[-0.025em] sm:text-[2rem]`}
            >
              {active.title}
            </p>
            <p className="mt-4 max-w-[30em] text-[0.9375rem] leading-relaxed text-[color:var(--ink-muted)]">
              {active.body}
            </p>
            <span className="mt-6 inline-flex min-h-10 items-center rounded-full bg-[color:var(--ink)] px-5 text-sm font-semibold text-white">
              {active.cta}
            </span>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3" aria-hidden>
            <div className="h-16 rounded-lg bg-[#f3ece5]" />
            <div className="h-16 rounded-lg bg-[#f3ece5]" />
            <div className="h-16 rounded-lg bg-[#f3ece5]" />
          </div>
        </div>
      </div>

      <figcaption className="mt-4 text-sm text-[color:var(--ink-muted)]">
        Sama sivu, kolme mainosta. Kävijä näkee version, joka on kirjoitettu
        mainokselle, jota hän klikkasi.
      </figcaption>
    </figure>
  );
}
