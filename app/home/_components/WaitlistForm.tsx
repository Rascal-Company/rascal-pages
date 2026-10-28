"use client";

import { useActionState, useId, useState } from "react";
import { joinWaitlist, type WaitlistState } from "@/app/actions/waitlist";
import { REFERRAL_JUMP } from "@/src/lib/waitlist";
import styles from "../home.module.css";

type WaitlistFormProps = {
  /** Tumma osio: kenttä ja tekstit vaaleina. */
  tone?: "light" | "dark";
};

const INITIAL: WaitlistState = { status: "idle" };

// Kutsukoodi ja kampanjalähde luetaan osoitteesta vasta lähetyshetkellä, jotta
// etusivu pysyy staattisena.
function withLandingParams(formData: FormData): FormData {
  const search = new URLSearchParams(window.location.search);
  formData.set("ref", search.get("ref") ?? "");
  formData.set("source", search.get("utm_source") ?? "");
  return formData;
}

function ShareLink({ url, tone }: { url: string; tone: "light" | "dark" }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      <input
        readOnly
        value={url}
        aria-label="Oma kutsulinkkisi"
        onFocus={(e) => e.currentTarget.select()}
        className={`${styles.input} ${tone === "dark" ? styles.inputDark : ""} flex-1`}
      />
      <button
        type="button"
        className={`${styles.btn} ${tone === "dark" ? styles.btnAccent : styles.btnPrimary}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {
            // Leikepöytä estetty: kenttä on valittavissa käsin.
          }
        }}
      >
        {copied ? "Kopioitu" : "Kopioi linkki"}
      </button>
    </div>
  );
}

export default function WaitlistForm({ tone = "light" }: WaitlistFormProps) {
  const [state, formAction, pending] = useActionState(joinWaitlist, INITIAL);
  const emailId = useId();
  const errorId = useId();

  if (state.status === "joined") {
    return (
      <div role="status" className="max-w-[34rem]">
        <p className={styles.h3}>Olet jonossa sijalla {state.position}.</p>
        <p className={`${styles.body} mt-2`}>
          Jokainen kaveri, joka liittyy linkilläsi, nostaa sinua {REFERRAL_JUMP} sijaa.
        </p>
        <ShareLink url={state.shareUrl} tone={tone} />
      </div>
    );
  }

  const error = state.status === "error" ? state.error : null;

  return (
    <form action={(formData) => formAction(withLandingParams(formData))} className="max-w-[34rem]" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={emailId} className="sr-only">
          Sähköpostiosoite
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="nimi@yritys.fi"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${styles.input} ${tone === "dark" ? styles.inputDark : ""} flex-1`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`${styles.btn} ${styles.btnAccent} ${styles.btnLarge} whitespace-nowrap`}
        >
          {pending ? "Liitytään…" : "Liity jonoon"}
        </button>
      </div>
      {/* Honeypot: piilossa ihmisiltä ja ruudunlukijoilta. */}
      <input
        type="text"
        name="_hp_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />
      <p className={`mt-3 text-[0.8125rem] ${tone === "dark" ? "text-white/60" : "text-[color:var(--ink-muted)]"}`}>
        Lähetämme sähköpostia Rascal Pagesin avaamisesta. Voit perua tilauksen milloin tahansa.
      </p>
      {error && (
        <p id={errorId} role="alert" className={`mt-3 text-sm font-medium ${tone === "dark" ? "text-[#ffb59a]" : "text-[color:var(--accent-ink)]"}`}>
          {error}
        </p>
      )}
    </form>
  );
}
