import { useMemo } from "react";

export interface UncontrolledValue<T> {
  get value(): T;

  attachController(getter: () => T): void;
}

export function useUncontrolledValue<T>(initialValue: T): UncontrolledValue<T> {
  return useMemo(() => {
    let controller = () => initialValue;
    return {
      get value() { return controller(); },
      attachController(getter) {
        controller = getter;
      },
    };
  }, []);
}
