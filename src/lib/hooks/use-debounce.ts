"use client";
import { useEffect, useState } from "react";

/**
 * useDebounce hook
 *
 * Returns a debounced version of the value that only updates after the specified delay.
 *
 * @param value - The value to debounce.
 * @param delay - The delay in milliseconds.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup the timer if value or delay changes or on unmount
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
