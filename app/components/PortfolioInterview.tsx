"use client";

import { createElement } from "react";
import Script from "next/script";

type PortfolioInterviewProps = {
  userId: string | null;
};

/**
 * Hosts the ElevenLabs Conversational AI voice interview. The user's identity
 * is passed to the agent as dynamic variables so the post-call n8n webhook can
 * attribute the generated site back to the right organization. The widget is a
 * custom element, so it is created via `createElement` to avoid JSX intrinsic
 * typing. Generation happens after the call (n8n → /api/portfolio-interview).
 */
export default function PortfolioInterview({
  userId,
}: PortfolioInterviewProps) {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  if (!agentId) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm font-medium text-yellow-900">
          Haastattelu tulossa pian
        </p>
        <p className="mt-1 text-sm text-yellow-800">
          Ääni­haastattelu otetaan käyttöön, kun ElevenLabs-agentti on
          konfiguroitu (NEXT_PUBLIC_ELEVENLABS_AGENT_ID).
        </p>
      </div>
    );
  }

  const dynamicVariables = JSON.stringify({
    action: "portfolioSite",
    user_id: userId ?? "",
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-900">
          Vastaa lyhyeen haastatteluun puhumalla
        </p>
        <p className="mt-1 text-sm text-blue-800">
          Kerro kuka olet, mitä teet ja muutamasta työstäsi. Rakennamme
          portfoliosi vastaustesi pohjalta — voit hioa sitä jälkikäteen ja
          lisätä kuvat itse.
        </p>
      </div>

      <div className="flex min-h-[120px] items-center justify-center">
        {createElement("elevenlabs-convai", {
          "agent-id": agentId,
          "dynamic-variables": dynamicVariables,
        })}
      </div>

      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
        async
      />
    </div>
  );
}
