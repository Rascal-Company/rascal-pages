"use client";

import { useRouter } from "next/navigation";

interface EditorHeaderProps {
  siteSubdomain: string;
  onSettingsClick: () => void;
}

export default function EditorHeader({
  siteSubdomain,
  onSettingsClick,
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
        <button
          onClick={onSettingsClick}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Asetukset
        </button>
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
