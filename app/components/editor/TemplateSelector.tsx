"use client";

import { TEMPLATES, getTemplateById } from "@/src/lib/templates";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";

interface TemplateSelectorProps {
  currentTemplateId: string;
  onTemplateChange: (templateId: string) => void;
  /** Paketin sallimat pohjat; null = kaikki. Muut näytetään lukittuina. */
  allowedTemplateIds?: string[] | null;
}

const DEMO_URL = "https://www.rascal.fi";

export default function TemplateSelector({
  currentTemplateId,
  onTemplateChange,
  allowedTemplateIds = null,
}: TemplateSelectorProps) {
  const currentTemplate = getTemplateById(currentTemplateId);
  const isLocked = (id: string) => allowedTemplateIds !== null && !allowedTemplateIds.includes(id);
  const hasLocked = TEMPLATES.some((t) => isLocked(t.id));

  return (
    <div className="rounded-lg border border-border p-4 bg-muted">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Template</h2>
      <Select
        value={currentTemplateId || "saas-modern"}
        onValueChange={onTemplateChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TEMPLATES.map((template) => (
            <SelectItem key={template.id} value={template.id} disabled={isLocked(template.id)}>
              {isLocked(template.id) ? `🔒 ${template.name} · Rascal` : template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentTemplate && (
        <p className="mt-2 text-xs text-muted-foreground">
          {currentTemplate.description}
        </p>
      )}
      {hasLocked && (
        <p className="mt-3 text-xs text-muted-foreground">
          🔒 Landerit sisältyvät Rascal-pakettiin.{" "}
          <a href={DEMO_URL} target="_blank" rel="noreferrer" className="font-medium text-foreground underline underline-offset-2">
            Varaa demo
          </a>
        </p>
      )}
    </div>
  );
}
