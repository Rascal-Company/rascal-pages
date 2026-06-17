"use client";

import { useCallback, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";

type PortfolioInterviewProps = {
  userId: string | null;
  onClose: () => void;
};

type Phase = "idle" | "connecting" | "active" | "sending" | "done" | "error";

const PHASE_LABELS: Record<Phase, string> = {
  idle: "Aloita haastattelu, kun olet valmis.",
  connecting: "Yhdistetään…",
  active: "Haastattelu käynnissä",
  sending: "Lähetetään vastauksia…",
  done: "Valmista! Portfoliosi rakennetaan nyt.",
  error: "Jokin meni pieleen",
};

/**
 * Full-screen voice interview with a custom orb UI. Runs the ElevenLabs
 * conversation via the React SDK (no widget). When the call ends — whether
 * the agent ends it or the user does — the browser POSTs the conversation id
 * and the user's identity to the n8n webhook, which fetches the transcript
 * from the ElevenLabs API and builds the portfolio site.
 */
function InterviewOrb({ userId, onClose }: PortfolioInterviewProps) {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  const webhookUrl = process.env.NEXT_PUBLIC_PORTFOLIO_WEBHOOK_URL;

  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const conversationIdRef = useRef<string | null>(null);
  const sentRef = useRef(false);

  const sendResult = useCallback(async () => {
    if (sentRef.current) return;
    sentRef.current = true;

    if (!webhookUrl) {
      setPhase("error");
      setErrorMessage(
        "Webhook-osoite puuttuu (NEXT_PUBLIC_PORTFOLIO_WEBHOOK_URL).",
      );
      return;
    }
    if (!conversationIdRef.current) {
      setPhase("error");
      setErrorMessage("Keskustelun tunnistetta ei saatu. Yritä uudelleen.");
      return;
    }

    setPhase("sending");
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "portfolioSite",
          conversationId: conversationIdRef.current,
          userId: userId ?? "",
          endedAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        throw new Error(`Webhook vastasi ${response.status}`);
      }
      setPhase("done");
    } catch {
      sentRef.current = false;
      setPhase("error");
      setErrorMessage(
        "Vastausten lähetys epäonnistui. Tarkista yhteys ja yritä uudelleen.",
      );
    }
  }, [webhookUrl, userId]);

  const conversation = useConversation({
    onConnect: () => {
      try {
        conversationIdRef.current = conversation.getId();
      } catch {
        // id is re-read on demand before sending
      }
      setPhase("active");
    },
    onDisconnect: () => {
      if (conversationIdRef.current) {
        void sendResult();
      }
    },
    onError: () => {
      setPhase("error");
      setErrorMessage("Yhteysvirhe haastattelun aikana. Yritä uudelleen.");
    },
  });

  const handleStart = async () => {
    if (!agentId) return;
    setPhase("connecting");
    setErrorMessage("");
    sentRef.current = false;
    conversationIdRef.current = null;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      conversation.startSession({
        agentId,
        connectionType: "webrtc",
        dynamicVariables: {
          action: "portfolioSite",
          user_id: userId ?? "",
        },
      });
    } catch {
      setPhase("error");
      setErrorMessage(
        "Mikrofonia ei saatu käyttöön. Salli mikrofoni selaimen asetuksista.",
      );
    }
  };

  const handleEnd = () => {
    try {
      conversationIdRef.current = conversation.getId();
    } catch {
      // keep the id captured on connect
    }
    conversation.endSession();
  };

  const handleRetrySend = () => {
    void sendResult();
  };

  const isSpeaking = phase === "active" && conversation.isSpeaking;
  const isListening = phase === "active" && !conversation.isSpeaking;

  if (!agentId) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0a0a0b]/95 p-6">
        <div className="max-w-md rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-6 text-center">
          <p className="font-medium text-yellow-200">
            Haastattelu tulossa pian
          </p>
          <p className="mt-2 text-sm text-yellow-200/80">
            Ääni­haastattelu otetaan käyttöön, kun ElevenLabs-agentti on
            konfiguroitu (NEXT_PUBLIC_ELEVENLABS_AGENT_ID).
          </p>
          <button
            onClick={onClose}
            className="mt-6 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
          >
            Sulje
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#0a0a0b]/95 p-6">
      {phase !== "active" && phase !== "sending" && (
        <button
          onClick={onClose}
          aria-label="Sulje"
          className="absolute right-6 top-6 text-white/40 transition-colors hover:text-white"
        >
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      <div className="relative mb-10 h-44 w-44">
        <div
          aria-hidden="true"
          className={`absolute -inset-6 rounded-full blur-2xl transition-opacity duration-700 ${
            phase === "active" ? "opacity-70" : "opacity-40"
          }`}
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.55), rgba(139,92,246,0.25) 60%, transparent 75%)",
          }}
        />
        {isListening && (
          <div
            aria-hidden="true"
            className="orb-ring absolute -inset-3 rounded-full border border-blue-400/40"
          />
        )}
        <div
          className={`orb-core relative h-full w-full rounded-full ${
            isSpeaking ? "orb-speaking" : ""
          } ${phase === "connecting" || phase === "sending" ? "orb-busy" : ""}`}
        />
      </div>

      <p className="text-lg font-medium text-[#f5f5f7]">
        {PHASE_LABELS[phase]}
      </p>

      {phase === "active" && (
        <p className="mt-2 text-sm text-[#a1a1aa]">
          {isSpeaking ? "Haastattelija puhuu…" : "Kuuntelen — kerro vapaasti."}
        </p>
      )}
      {phase === "idle" && (
        <p className="mt-2 max-w-md text-center text-sm text-[#a1a1aa]">
          Juttelemme noin kymmenen minuuttia työstäsi, ja rakennamme portfoliosi
          vastaustesi pohjalta. Voit hioa tekstejä ja lisätä kuvat jälkikäteen.
        </p>
      )}
      {phase === "done" && (
        <p className="mt-2 max-w-md text-center text-sm text-[#a1a1aa]">
          Sivu ilmestyy hallintaasi hetken kuluttua. Voit sulkea tämän näkymän.
        </p>
      )}
      {phase === "error" && (
        <p className="mt-2 max-w-md text-center text-sm text-red-400">
          {errorMessage}
        </p>
      )}

      <div className="mt-10 flex items-center gap-4">
        {(phase === "idle" || phase === "error") && (
          <button
            onClick={
              phase === "error" && conversationIdRef.current && !sentRef.current
                ? handleRetrySend
                : handleStart
            }
            className="rounded-full bg-blue-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-transform hover:-translate-y-0.5"
          >
            {phase === "error" && conversationIdRef.current
              ? "Lähetä uudelleen"
              : "Aloita haastattelu"}
          </button>
        )}
        {phase === "active" && (
          <button
            onClick={handleEnd}
            className="rounded-full border border-white/20 px-8 py-3 text-base font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            Lopeta haastattelu
          </button>
        )}
        {phase === "done" && (
          <button
            onClick={onClose}
            className="rounded-full bg-blue-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-transform hover:-translate-y-0.5"
          >
            Sulje
          </button>
        )}
      </div>
    </div>
  );
}

export default function PortfolioInterview(props: PortfolioInterviewProps) {
  return (
    <ConversationProvider>
      <InterviewOrb {...props} />
    </ConversationProvider>
  );
}
