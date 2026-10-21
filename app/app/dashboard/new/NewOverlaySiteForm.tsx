"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createOverlaySite } from "@/app/actions/overlay";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

export default function NewOverlaySiteForm() {
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await createOverlaySite({ targetUrl });
    if (result.success) {
      const { siteId, campaignId, landingPageId } = result.data;
      router.push(`/app/dashboard/${siteId}/overlay/${campaignId}/${landingPageId}`);
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/app/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Takaisin dashboardiin
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-foreground">
            Overlay asiakkaan sivulle
          </h1>
          <p className="mt-2 text-muted-foreground">
            Anna asiakkaan sivun osoite. Sivu avautuu editoriin, jossa voit
            klikata ja muokata tekstejä, kuvia ja linkkejä. Esikatselulinkin voi
            jakaa heti — asennusta tarvitaan vasta tuotantokäyttöön.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="targetUrl">Sivun osoite</Label>
              <Input
                id="targetUrl"
                type="text"
                inputMode="url"
                required
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                disabled={isSubmitting}
                placeholder="https://asiakas.fi"
                className="mt-2"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting || !targetUrl} className="flex-1">
                {isSubmitting ? "Avataan..." : "Avaa editori"}
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/app/dashboard">Peruuta</Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
