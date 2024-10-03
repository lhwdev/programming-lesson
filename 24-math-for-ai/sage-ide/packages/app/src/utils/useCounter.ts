import { useMemo } from "react";

export function useCounter(value: unknown): number {
  const counter = useMemo(() => ({ value, counter: 0 }), []);
  if(counter.value !== value) {
    counter.counter++;
  }
  return counter.counter;
}
