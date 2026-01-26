"use client";

type FooterBlockEditorProps = {
  content: null;
  onUpdate: (content: null) => void;
};

export default function FooterBlockEditor({}: FooterBlockEditorProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Footer näytetään automaattisesti sivun alaosassa.
      </p>
      <p className="text-xs text-gray-500">
        Tulossa pian: Mahdollisuus muokata footerin sisältöä.
      </p>
    </div>
  );
}
