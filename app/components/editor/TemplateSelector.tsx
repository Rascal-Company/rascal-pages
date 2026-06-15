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
}

export default function TemplateSelector({
  currentTemplateId,
  onTemplateChange,
}: TemplateSelectorProps) {
  const currentTemplate = getTemplateById(currentTemplateId);

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
            <SelectItem key={template.id} value={template.id}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentTemplate && (
        <p className="mt-2 text-xs text-muted-foreground">
          {currentTemplate.description}
        </p>
      )}
    </div>
  );
}
