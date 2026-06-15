"use client";

import type { FaqItem } from "@/src/lib/templates";

type FaqBlockEditorProps = {
  content: FaqItem[];
  onUpdate: (content: FaqItem[]) => void;
};

export default function FaqBlockEditor({
  content,
  onUpdate,
}: FaqBlockEditorProps) {
  const faq = content || [];

  const handleAdd = () => {
    onUpdate([...faq, { question: "Kysymys?", answer: "Vastaus" }]);
  };

  const handleRemove = (index: number) => {
    onUpdate(faq.filter((_, i) => i !== index));
  };

  const handleFieldUpdate = (
    index: number,
    field: keyof FaqItem,
    value: string,
  ) => {
    onUpdate(
      faq.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">UKK</span>
        <button
          onClick={handleAdd}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + Lisää
        </button>
      </div>
      <div className="space-y-4">
        {faq.map((item, index) => (
          <div
            key={index}
            className="rounded-md border border-border bg-muted p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Kysymys {index + 1}
              </span>
              <button
                onClick={() => handleRemove(index)}
                className="text-sm text-destructive hover:text-destructive"
              >
                Poista
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Kysymys
                </label>
                <input
                  type="text"
                  value={item.question || ""}
                  onChange={(e) =>
                    handleFieldUpdate(index, "question", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Vastaus
                </label>
                <textarea
                  value={item.answer || ""}
                  onChange={(e) =>
                    handleFieldUpdate(index, "answer", e.target.value)
                  }
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
