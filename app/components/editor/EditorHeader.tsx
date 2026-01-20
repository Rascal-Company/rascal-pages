'use client';

import { useRouter } from 'next/navigation';

interface EditorHeaderProps {
  siteSubdomain: string;
}

export default function EditorHeader({ siteSubdomain }: EditorHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6">
      <button
        onClick={() => router.push('/app/dashboard')}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← Takaisin dashboardiin
      </button>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        Muokkaa sivustoa
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {siteSubdomain}.rascalpages.com
      </p>
    </div>
  );
}
