"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAiSite } from "@/app/actions/create-ai-site";
import { useToast } from "@/app/components/ui/ToastContainer";
import PortfolioInterview from "@/app/components/PortfolioInterview";

interface CreateAiSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
}

type Mode = "choose" | "landing" | "portfolio";

export default function CreateAiSiteModal({
  isOpen,
  onClose,
  userId = null,
}: CreateAiSiteModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>("choose");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.link) {
      showToast("Täytä kaikki kentät", "error");
      return;
    }

    startTransition(async () => {
      const result = await createAiSite(formData);
      if (result.success) {
        showToast(
          "AI-sivu luotu onnistuneesti! Dashboard päivitetään.",
          "success",
        );
        setFormData({ title: "", description: "", link: "" });
        onClose();

        // Refresh the page to show the new site
        router.refresh();
      } else {
        showToast(result.error || "Jokin meni pieleen", "error");
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setFormData({ title: "", description: "", link: "" });
      setMode("choose");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {mode !== "choose" && (
              <button
                onClick={() => setMode("choose")}
                disabled={isPending}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                aria-label="Takaisin"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <h2 className="text-xl font-bold text-brand-dark">
              {mode === "portfolio"
                ? "Luo portfolio haastattelulla"
                : "Luo sivu AI:n avulla"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Sulje"
          >
            <svg
              className="h-6 w-6"
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
        </div>

        {mode === "choose" && (
          <div className="space-y-3">
            <p className="text-sm text-brand-dark/70">
              Valitse mitä haluat luoda.
            </p>
            <button
              type="button"
              onClick={() => setMode("landing")}
              className="w-full rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-brand-accent hover:bg-brand-accent/5"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📄</span>
                <span className="font-semibold text-brand-dark">
                  Landing page
                </span>
              </div>
              <p className="mt-1 text-sm text-brand-dark/60">
                Nopea kampanjasivu yhdellä toiminnolla. Anna tiedot, AI
                rakentaa.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMode("portfolio")}
              className="w-full rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-brand-accent hover:bg-brand-accent/5"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🎙️</span>
                <span className="font-semibold text-brand-dark">
                  Portfolio / sivusto
                </span>
              </div>
              <p className="mt-1 text-sm text-brand-dark/60">
                Vastaa lyhyeen ääni­haastatteluun, ja rakennamme portfoliosi.
                Sopii kaikille aloille.
              </p>
            </button>
          </div>
        )}

        {mode === "portfolio" && <PortfolioInterview userId={userId} />}

        {mode === "landing" && (
          <>
            <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
              <div className="flex gap-3">
                <svg
                  className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Beta-vaiheessa
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    Anna tiedot ja AI luo sinulle valmiin landing page -sivun.
                    Tämä ominaisuus on vielä kehitteillä ja saattaa sisältää
                    virheitä.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-brand-dark mb-2"
                >
                  Otsikko
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  disabled={isPending}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-brand-dark focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:opacity-50"
                  placeholder="Esim. Ilmainen E-kirja markkinoinnista"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-brand-dark mb-2"
                >
                  Kuvaus
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={isPending}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-brand-dark focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:opacity-50"
                  placeholder="Kerro mistä sivusi käsittelee ja mitä haluat tarjota kävijöille..."
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="link"
                  className="block text-sm font-medium text-brand-dark mb-2"
                >
                  Linkki
                </label>
                <input
                  type="url"
                  id="link"
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  disabled={isPending}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-brand-dark focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:opacity-50"
                  placeholder="https://esimerkki.fi/lataa-ekirja"
                  required
                />
                <p className="mt-1 text-xs text-brand-dark/60">
                  Mihin käyttäjät ohjataan kun he klikkaavat CTA-nappia
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="rounded-md border border-brand-dark/20 bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-light disabled:opacity-50"
                >
                  Peruuta
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-brand-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover disabled:opacity-50"
                >
                  {isPending ? "Lähetetään..." : "Luo sivu"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
