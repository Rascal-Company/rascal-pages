"use client";

type OrgProduct = {
  slug: string;
  status: string;
  access_type: string | null;
  trial_ends_at: string | null;
};

export function NoAccessPage({
  currentProduct,
}: {
  currentProduct: OrgProduct | null;
}) {
  const isTrialExpired =
    currentProduct?.access_type === "trial" &&
    currentProduct.trial_ends_at &&
    new Date(currentProduct.trial_ends_at) <= new Date();

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6">
      <div className="max-w-md rounded-xl bg-white p-10 text-center shadow-lg">
        {isTrialExpired ? (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-500">
              <svg
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h1 className="mb-3 text-2xl font-bold text-gray-900">
              Kokeilujakso päättynyt
            </h1>
            <p className="mb-8 text-sm leading-relaxed text-gray-500">
              Rascal Pages -kokeilujaksosi on päättynyt. Päivitä tilauksesi
              jatkaaksesi palvelun käyttöä.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-500">
              <svg
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="mb-3 text-2xl font-bold text-gray-900">
              Ei käyttöoikeutta
            </h1>
            <p className="mb-8 text-sm leading-relaxed text-gray-500">
              Organisaatiollasi ei ole pääsyä Rascal Pages -tuotteeseen. Ota
              yhteyttä myyntiin aktivoidaksesi tuotteen.
            </p>
          </>
        )}
        <div className="flex flex-col items-center gap-3">
          <a
            href="https://www.rascal.fi/hinnat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#E87B4E] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D66A3D]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            Päivitä tilaus
          </a>
          <a
            href="mailto:info@rascal.fi"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Ota yhteyttä
          </a>
        </div>
      </div>
    </div>
  );
}
