"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Post } from "@/src/lib/posts";
import { formatPostDate } from "@/src/lib/posts";
import {
  createPost,
  updatePost,
  deletePost,
  type PostInput,
} from "@/app/actions/posts";
import { useToast } from "@/app/components/ui/ToastContainer";
import { Button } from "@/app/components/ui/button";

interface PostsClientProps {
  siteId: string;
  subdomain: string;
  posts: Post[];
}

type Draft = PostInput & { id: string | null };

const EMPTY_DRAFT: Draft = {
  id: null,
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  coverImage: "",
  published: false,
  seoTitle: "",
  seoDescription: "",
};

function toDraft(post: Post): Draft {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt ?? "",
    coverImage: post.coverImage ?? "",
    published: post.published,
    seoTitle: post.seoTitle ?? "",
    seoDescription: post.seoDescription ?? "",
  };
}

export default function PostsClient({
  siteId,
  subdomain,
  posts,
}: PostsClientProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const setField = <K extends keyof Draft>(field: K, value: Draft[K]) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      showToast("Otsikko on pakollinen.", "error");
      return;
    }
    setIsSaving(true);
    try {
      const input: PostInput = {
        title: draft.title,
        slug: draft.slug,
        content: draft.content,
        excerpt: draft.excerpt,
        coverImage: draft.coverImage,
        published: draft.published,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
      };
      const result = draft.id
        ? await updatePost(siteId, draft.id, input)
        : await createPost(siteId, input);
      if (result.success) {
        showToast("Postaus tallennettu!", "success");
        setDraft(null);
        router.refresh();
      } else {
        showToast(result.error, "error");
      }
    } catch {
      showToast("Odottamaton virhe. Yritä uudelleen.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (postId: string) => {
    setDeletingId(postId);
    try {
      const result = await deletePost(siteId, postId);
      if (result.success) {
        showToast("Postaus poistettu.", "success");
        router.refresh();
      } else {
        showToast(result.error, "error");
      }
    } catch {
      showToast("Odottamaton virhe. Yritä uudelleen.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={`/app/dashboard/${siteId}`}
            className="mb-4 inline-flex items-center text-sm text-brand-dark/70 hover:text-brand-dark"
          >
            ← Takaisin editoriin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-dark">Blogi</h1>
              <p className="mt-2 text-sm text-brand-dark/70">
                Kirjoita ja julkaise blogipostauksia osoitteessa{" "}
                <code>{subdomain}.rascalpages.fi/blog</code>
              </p>
            </div>
            {!draft && (
              <Button onClick={() => setDraft({ ...EMPTY_DRAFT })} size="lg">
                + Uusi postaus
              </Button>
            )}
          </div>
        </div>

        {draft ? (
          <PostEditor
            draft={draft}
            isSaving={isSaving}
            onChange={setField}
            onSave={handleSave}
            onCancel={() => setDraft(null)}
          />
        ) : posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-brand-dark/20 bg-card p-12 text-center">
            <h3 className="text-lg font-semibold text-brand-dark">
              Ei vielä postauksia
            </h3>
            <p className="mt-2 text-sm text-brand-dark/70">
              Aloita kirjoittamalla ensimmäinen blogipostaus.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li
                key={post.id}
                className="flex items-center justify-between rounded-lg border border-brand-dark/10 bg-card p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-medium text-brand-dark">
                      {post.title}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        post.published
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {post.published ? "Julkaistu" : "Luonnos"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-brand-dark/60">
                    /{post.slug}
                    {post.publishedAt
                      ? ` · ${formatPostDate(post.publishedAt)}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setDraft(toDraft(post))}
                    className="rounded-md border border-brand-dark/20 bg-card px-3 py-1.5 text-sm font-medium text-brand-dark hover:bg-brand-light"
                  >
                    Muokkaa
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={deletingId === post.id}
                    className="rounded-md border border-red-300 bg-card px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === post.id ? "Poistetaan…" : "Poista"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface PostEditorProps {
  draft: Draft;
  isSaving: boolean;
  onChange: <K extends keyof Draft>(field: K, value: Draft[K]) => void;
  onSave: () => void;
  onCancel: () => void;
}

function PostEditor({
  draft,
  isSaving,
  onChange,
  onSave,
  onCancel,
}: PostEditorProps) {
  const inputClass =
    "w-full rounded-md border border-brand-dark/20 bg-card px-4 py-2 text-sm text-brand-dark outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

  return (
    <div className="space-y-5 rounded-lg border border-brand-dark/10 bg-card p-6 shadow-sm">
      <Field label="Otsikko">
        <input
          type="text"
          value={draft.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="Postauksen otsikko"
          className={inputClass}
        />
      </Field>

      <Field
        label="Slug (valinnainen)"
        hint="Jätä tyhjäksi luodaksesi automaattisesti otsikosta."
      >
        <input
          type="text"
          value={draft.slug}
          onChange={(e) => onChange("slug", e.target.value)}
          placeholder="esim. ensimmainen-postaus"
          className={inputClass}
        />
      </Field>

      <Field label="Sisältö">
        <textarea
          value={draft.content}
          onChange={(e) => onChange("content", e.target.value)}
          rows={12}
          placeholder="Kirjoita postauksen sisältö (markdown tukee kappaleita)…"
          className={`${inputClass} font-mono`}
        />
      </Field>

      <Field
        label="Tiivistelmä (valinnainen)"
        hint="Jätä tyhjäksi luodaksesi automaattisesti sisällöstä."
      >
        <textarea
          value={draft.excerpt}
          onChange={(e) => onChange("excerpt", e.target.value)}
          rows={2}
          className={inputClass}
        />
      </Field>

      <Field label="Kansikuvan URL (valinnainen)">
        <input
          type="text"
          value={draft.coverImage}
          onChange={(e) => onChange("coverImage", e.target.value)}
          placeholder="https://…"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SEO-otsikko (valinnainen)">
          <input
            type="text"
            value={draft.seoTitle}
            onChange={(e) => onChange("seoTitle", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="SEO-kuvaus (valinnainen)">
          <input
            type="text"
            value={draft.seoDescription}
            onChange={(e) => onChange("seoDescription", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={draft.published ?? false}
          onChange={(e) => onChange("published", e.target.checked)}
          className="h-4 w-4 rounded border-brand-dark/30"
        />
        <span className="text-sm font-medium text-brand-dark">
          Julkaise heti
        </span>
      </label>

      <div className="flex gap-3 pt-2">
        <Button onClick={onSave} disabled={isSaving} size="lg">
          {isSaving ? "Tallennetaan…" : "Tallenna"}
        </Button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-md border border-brand-dark/20 bg-card px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-light disabled:opacity-50"
        >
          Peruuta
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-dark">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-brand-dark/60">{hint}</p>}
    </div>
  );
}
