"use client";

import { TEMPLATES, getTemplateById, Template } from "@/src/lib/templates";

interface TemplateSelectorProps {
  currentTemplateId: string;
  onTemplateChange: (templateId: string) => void;
}

export default function TemplateSelector({
  currentTemplateId,
  onTemplateChange,
}: TemplateSelectorProps) {
  const currentTemplate = getTemplateById(currentTemplateId);

  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Template</h2>
      <select
        value={currentTemplateId || "saas-modern"}
        onChange={(e) => onTemplateChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
      >
        {TEMPLATES.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
      {currentTemplate && (
        <p className="mt-2 text-xs text-gray-600">
          {currentTemplate.description}
        </p>
      )}
    </div>
  );
}
