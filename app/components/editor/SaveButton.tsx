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
        className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
      >
        {isSaving ? 'Tallennetaan...' : 'Tallenna muutokset'}
      </button>
    </div>
  );
}
