"use client";

import { useState } from "react";

interface Lead {
  id: string;
  email: string;
  name: string | null;
  marketing_consent: boolean;
  created_at: string;
}

interface LeadsTableProps {
  leads: Lead[];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("fi-FI", {
    timeZone: "Europe/Helsinki",
  });
}

function exportToCSV(leads: Lead[], filename: string): void {
  const headers = ["Sähköposti", "Nimi", "Markkinointilupa", "Päivämäärä"];
  const rows = leads.map((lead) => [
    lead.email,
    lead.name || "",
    lead.marketing_consent ? "Kyllä" : "Ei",
    formatDate(lead.created_at),
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function LeadsTable({ leads }: LeadsTableProps) {
  const [onlyMarketingConsent, setOnlyMarketingConsent] = useState(false);

  const filteredLeads = onlyMarketingConsent
    ? leads.filter((lead) => lead.marketing_consent)
    : leads;

  const handleExport = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    const suffix = onlyMarketingConsent ? "_markkinointilupa" : "";
    exportToCSV(filteredLeads, `liidit${suffix}_${timestamp}.csv`);
  };

  return (
    <div className="mb-8 rounded-lg border border-brand-dark/10 bg-brand-beige">
      <div className="border-b border-brand-dark/10 px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-brand-dark">
            Liidit ({filteredLeads.length}
            {onlyMarketingConsent && ` / ${leads.length}`})
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm text-brand-dark/70">
              <input
                type="checkbox"
                checked={onlyMarketingConsent}
                onChange={(e) => setOnlyMarketingConsent(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
              />
              Vain markkinointilupa
            </label>
            <button
              onClick={handleExport}
              disabled={filteredLeads.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-brand-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Lataa CSV
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        {filteredLeads.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-brand-dark/60">
              {onlyMarketingConsent
                ? "Ei liidejä joilla on markkinointilupa."
                : "Ei vielä liidejä. Kun joku täyttää lomakkeen, se näkyy tässä."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-brand-dark/70">
                  Sähköposti
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-brand-dark/70">
                  Nimi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-brand-dark/70">
                  Markkinointilupa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-brand-dark/70">
                  Päivämäärä
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/10 bg-brand-beige">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-brand-dark">
                    {lead.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-brand-dark">
                    {lead.name || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {lead.marketing_consent ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                        Kyllä
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                        Ei
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-brand-dark/70">
                    {formatDate(lead.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
