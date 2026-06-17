"use client";

interface StatusMessagesProps {
  error: string | null;
  success: boolean;
}

export default function StatusMessages({
  error,
  success,
}: StatusMessagesProps) {
  return (
    <>
      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
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
