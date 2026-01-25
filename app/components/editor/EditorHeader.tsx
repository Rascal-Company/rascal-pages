"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface EditorHeaderProps {
  siteId: string;
  siteSubdomain: string;
}

export default function EditorHeader({
  siteId,
  siteSubdomain,
}: EditorHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/app/dashboard")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Takaisin dashboardiin
        </button>
        {/* TODO: Custom domain settings - aktivoi kun Cloudflare Workers on toteutettu
        <Link
          href={`/app/dashboard/${siteId}/settings`}
          className="rounded-md border border-brand-dark/20 bg-brand-beige px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-light"
        >
          ⚙️ Asetukset
        </Link>
        */}
      </div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        Muokkaa sivustoa
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {siteSubdomain}.rascalpages.fi
      </p>
    </div>
  );
}
