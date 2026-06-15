"use client";

import { useState } from "react";
import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createSite } from "@/app/actions";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

export default function NewSitePage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await createSite(formData);

      // Jos palautetaan error, näytetään se
      // Jos ei erroria, Server Action tekee redirectin automaattisesti
      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
      // Redirect tapahtuu Server Actionissa automaattisesti onnistuessa
    } catch (err) {
      if (isRedirectError(err)) {
        throw err;
      }
      setError("Odottamaton virhe. Yritä uudelleen.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Otsikko */}
        <div className="mb-8">
          <Link
            href="/app/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Takaisin dashboardiin
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-foreground">
            Uusi sivusto
          </h1>
          <p className="mt-2 text-muted-foreground">
            Luo uusi sivusto valitsemalla subdomain
          </p>
        </div>

        {/* Lomake */}
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <form action={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="subdomain">Subdomain</Label>
              <div className="mt-2 flex rounded-md shadow-sm">
                <Input
                  type="text"
                  id="subdomain"
                  name="subdomain"
                  required
                  pattern="[a-zA-Z0-9]+"
                  disabled={isSubmitting}
                  className="rounded-r-none"
                  placeholder="esimerkki"
                />
                <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  .rascalpages.fi
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Subdomain voi sisältää vain kirjaimia ja numeroita
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Luodaan..." : "Luo sivusto"}
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
