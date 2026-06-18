"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPage, deletePage } from "@/app/actions/pages";
import { TEMPLATES } from "@/src/lib/templates";
import { useToast } from "@/app/components/ui/ToastContainer";
import { Button } from "@/app/components/ui/button";

export type PageListItem = {
  slug: string;
  title: string;
  published: boolean;
  updated_at: string;
};

interface PagesClientProps {
  siteId: string;
  subdomain: string;
  pages: PageListItem[];
}

const DEFAULT_TEMPLATE_ID = "saas-modern";

export default function PagesClient({
  siteId,
  subdomain,
  pages,
}: PagesClientProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PageListItem | null>(null);

  const editHref = (pageSlug: string) =>
    pageSlug === "home"
      ? `/app/dashboard/${siteId}`
      : `/app/dashboard/${siteId}?page=${pageSlug}`;

  const resetForm = () => {
    setCreating(false);
    setTitle("");
    setSlug("");
    setTemplateId(DEFAULT_TEMPLATE_ID);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      showToast("Otsikko on pakollinen.", "error");
      return;
    }
    setIsSaving(true);
    try {
      const result = await createPage(siteId, { title, slug, templateId });
      if (result.success) {
        showToast("Sivu luotu!", "success");
        router.push(editHref(result.slug));
      } else {
        showToast(result.error, "error");
      }
    } catch {
      showToast("Odottamaton virhe. Yritä uudelleen.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (pageSlug: string) => {
    setDeletingSlug(pageSlug);
    try {
      const result = await deletePage(siteId, pageSlug);
      if (result.success) {
        showToast("Sivu poistettu.", "success");
        setPendingDelete(null);
        router.refresh();
      } else {
        showToast(result.error, "error");
      }
    } catch {
      showToast("Odottamaton virhe. Yritä uudelleen.", "error");
    } finally {
      setDeletingSlug(null);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/app/dashboard"
            className="mb-4 inline-flex items-center text-sm text-brand-dark/70 hover:text-brand-dark"
          >
            ← Takaisin dashboardille
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-dark">Sivut</h1>
              <p className="mt-2 text-sm text-brand-dark/70">
                Hallitse sivuston sivuja osoitteessa{" "}
                <code>{subdomain}.rascalpages.fi</code>
              </p>
            </div>
            {!creating && (
              <Button onClick={() => setCreating(true)} size="lg">
                + Uusi sivu
              </Button>
            )}
          </div>
        </div>

        {creating && (
          <div className="mb-8 rounded-lg border border-brand-dark/10 bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-dark">Uusi sivu</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark">
                  Otsikko
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Esim. Palvelut"
                  className="mt-1 w-full rounded-md border border-brand-dark/20 bg-card px-3 py-2 text-sm text-brand-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark">
                  Polku (valinnainen)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="palvelut"
                  className="mt-1 w-full rounded-md border border-brand-dark/20 bg-card px-3 py-2 text-sm text-brand-dark"
                />
                <p className="mt-1 text-xs text-brand-dark/60">
                  Sivun osoite on{" "}
                  <code>
                    {subdomain}.rascalpages.fi/{slug.trim() || "polku"}
                  </code>
                  . Tyhjänä polku luodaan otsikosta.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark">
                  Pohja
                </label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-brand-dark/20 bg-card px-3 py-2 text-sm text-brand-dark"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={resetForm}
                  disabled={isSaving}
                  className="rounded-md border border-brand-dark/20 bg-card px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-light disabled:opacity-50"
                >
                  Peruuta
                </button>
                <Button onClick={handleCreate} disabled={isSaving}>
                  {isSaving ? "Luodaan…" : "Luo ja muokkaa"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <ul className="space-y-3">
          {pages.map((page) => (
            <li
              key={page.slug}
              className="flex items-center justify-between gap-3 rounded-lg border border-brand-dark/10 bg-card p-4 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-medium text-brand-dark">
                    {page.title}
                  </h3>
                  {page.slug === "home" && (
                    <span className="shrink-0 rounded-full bg-brand-dark/10 px-2 py-0.5 text-xs font-medium text-brand-dark">
                      Etusivu
                    </span>
                  )}
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      page.published
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {page.published ? "Julkaistu" : "Luonnos"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-brand-dark/60">
                  /{page.slug === "home" ? "" : page.slug}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={editHref(page.slug)}
                  className="rounded-md border border-brand-dark/20 bg-card px-3 py-1.5 text-sm font-medium text-brand-dark hover:bg-brand-light"
                >
                  Muokkaa
                </Link>
                {page.slug !== "home" && (
                  <button
                    onClick={() => setPendingDelete(page)}
                    disabled={deletingSlug === page.slug}
                    className="rounded-md border border-red-300 bg-card px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingSlug === page.slug ? "Poistetaan…" : "Poista"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
            <h3 className="text-lg font-medium text-brand-dark">Poista sivu</h3>
            <p className="mt-2 text-sm text-brand-dark/70">
              Oletko varma että haluat poistaa sivun{" "}
              <span className="font-medium">{pendingDelete.title}</span>? Tätä
              toimintoa ei voi perua.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deletingSlug === pendingDelete.slug}
                className="rounded-md border border-brand-dark/20 bg-card px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-light disabled:opacity-50"
              >
                Peruuta
              </button>
              <button
                onClick={() => handleDelete(pendingDelete.slug)}
                disabled={deletingSlug === pendingDelete.slug}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deletingSlug === pendingDelete.slug ? "Poistetaan…" : "Poista"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
