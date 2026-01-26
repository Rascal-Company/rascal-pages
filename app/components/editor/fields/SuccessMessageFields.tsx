import type { TemplateConfig } from "@/src/lib/templates";

interface SuccessMessageFieldsProps {
  successMessage: TemplateConfig["successMessage"];
  onUpdate: (
    field: keyof NonNullable<TemplateConfig["successMessage"]>,
    value: string,
  ) => void;
}

export default function SuccessMessageFields({
  successMessage,
  onUpdate,
}: SuccessMessageFieldsProps) {
  return (
    <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        Lomakkeen onnistumisviesti
      </h3>
      <div className="space-y-3">
        <div>
          <label
            htmlFor="successTitle"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Otsikko
          </label>
          <input
            id="successTitle"
            type="text"
            value={successMessage?.title || ""}
            onChange={(e) => onUpdate("title", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Kiitos! Tietosi on tallennettu."
          />
        </div>
        <div>
          <label
            htmlFor="successDescription"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Kuvaus
          </label>
          <textarea
            id="successDescription"
            value={successMessage?.description || ""}
            onChange={(e) => onUpdate("description", e.target.value)}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Saat pian lisätietoja sähköpostiisi."
          />
        </div>
      </div>
    </div>
  );
}
