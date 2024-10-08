import { useMemo } from "react";

export function useCounter<T>(
  value: T,
  isUpdated: (before: T, after: T) => boolean = (b, a) => b !== a,
): number {
  const counter = useMemo(() => ({ value, counter: 0 }), []);
  if(isUpdated(counter.value, value)) {
    counter.counter++;
  }
  counter.value = value;
  return counter.counter;
}
