'use client';

interface StatusMessagesProps {
  error: string | null;
  success: boolean;
}

export default function StatusMessages({ error, success }: StatusMessagesProps) {
  return (
    <>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">Muutokset tallennettu!</p>
        </div>
      )}
    </>
  );
}
