"use client";

type LogosBlockEditorProps = {
  content: null;
  onUpdate: (content: null) => void;
};

export default function LogosBlockEditor({}: LogosBlockEditorProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Logo-osio näyttää kumppaneiden ja asiakkaiden logoja. Logot ovat tällä
        hetkellä placeholder-tilassa.
      </p>
      <p className="text-xs text-muted-foreground">
        Tulossa pian: Mahdollisuus lisätä omia logokuvia.
      </p>
    </div>
  );
}
