import { useCallback, useRef } from "react";

export function useDebounce<T extends unknown[]>(
  callback: (...args: T) => void | Promise<void>,
  delay: number,
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallRef = useRef<Date | null>(null);

  const debouncedCallback = useCallback(
    async (...args: T): Promise<boolean> => {
      const now = new Date();

      // Check if we're within the debounce window
      if (
        lastCallRef.current &&
        now.getTime() - lastCallRef.current.getTime() < delay
      ) {
        return false; // Debounced
      }

      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Update last call time
      lastCallRef.current = now;

      // Execute callback
      await callback(...args);

      return true; // Executed
    },
    [callback, delay],
  );

  return debouncedCallback;
}
