'use client';

interface SaveButtonProps {
  isSaving: boolean;
  onSave: () => void;
}

export default function SaveButton({ isSaving, onSave }: SaveButtonProps) {
  return (
    <div className="sticky bottom-0 bg-white pt-4">
      <button
        onClick={onSave}
        disabled={isSaving}
        className="w-full rounded-md bg-brand-accent px-4 py-3 text-sm font-medium text-white hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 disabled:bg-brand-accent/60 disabled:cursor-not-allowed"
      >
        {isSaving ? 'Tallennetaan...' : 'Tallenna muutokset'}
      </button>
    </div>
  );
}
