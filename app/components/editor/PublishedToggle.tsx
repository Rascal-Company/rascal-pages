'use client';

interface PublishedToggleProps {
  published: boolean;
  onToggle: (published: boolean) => void;
  isSaving?: boolean;
}

export default function PublishedToggle({
  published,
  onToggle,
  isSaving = false,
}: PublishedToggleProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Julkaisutila
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {published
              ? 'Sivu on julkinen ja näkyy kävijöille'
              : 'Sivu on piilossa ja näkyy vain sinulle'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(!published)}
          disabled={isSaving}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 
            focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
            ${published ? 'bg-blue-600' : 'bg-gray-200'}
          `}
          role="switch"
          aria-checked={published}
          aria-label={published ? 'Piilota sivu' : 'Julkaise sivu'}
        >
          <span
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out
              ${published ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>
    </div>
  );
}
