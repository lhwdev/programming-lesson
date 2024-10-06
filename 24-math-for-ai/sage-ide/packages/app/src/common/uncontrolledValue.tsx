import { useMemo } from "react";

const symbol = Symbol();

export interface UncontrolledValue<T> {
  [symbol]: true;
  get value(): T;
  set value(newValue: T);

  attachController(getter: () => T): void;
}

export function useUncontrolledValue<T>(initialValue: T): UncontrolledValue<T> {
  return useMemo(() => {
    let controller = () => initialValue;
    return {
      [symbol]: true,
      get value() { return controller(); },
      attachController(getter) {
        controller = getter;
      },
    };
  }, []);
}

export function useOnControlledChange<T>(
  value: T | UncontrolledValue<T>,
  onChange: (value: T) => void,
): { expectChanged: (newValue: T) => void } {
  const expect = useMemo(() => ({ value }), []);

  if(!(typeof value === "object" && value && symbol in value) && value !== expect.value) {
    onChange(value);
    expect.value = value;
  }

  return {
    expectChanged(newValue) {
      expect.value = newValue;
    },
  };
}
