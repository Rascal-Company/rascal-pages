"use client";

import { useProductAccess } from "@/src/hooks/useProductAccess";
import { NoAccessPage } from "@/src/components/NoAccessPage";

export function ProductGuard({
  productSlug,
  children,
}: {
  productSlug: string;
  children: React.ReactNode;
}) {
  const { hasAccess, currentProduct, isLoading } =
    useProductAccess(productSlug);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-gray-500">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#E87B4E]" />
        <p className="text-sm">Tarkistetaan käyttöoikeuksia...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return <NoAccessPage currentProduct={currentProduct} />;
  }

  return <>{children}</>;
}
