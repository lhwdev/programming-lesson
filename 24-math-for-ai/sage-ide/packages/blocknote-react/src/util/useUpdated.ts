import { useMemo } from "react";

export function useUpdated<T extends object>(value: T): T & { $current: T } {
  const updated = useUpdatedRaw(value);
  const c = () => updated.current;
  return new Proxy({}, {
    apply: (_, thisArg, argArray) => Reflect.apply(c() as never, thisArg, argArray),
    construct: (_, argArray, newTarget) => Reflect.construct(c() as never, argArray, newTarget),
    defineProperty: (_, property, attributes) => Reflect.defineProperty(c(), property, attributes),
    deleteProperty: (_, p) => Reflect.deleteProperty(c(), p),
    get(_, p, receiver) {
      const result = Reflect.get(c(), p, receiver);
      if(result === undefined && p === "$$current") return c();
      return result;
    },
    getOwnPropertyDescriptor: (_, p) => Reflect.getOwnPropertyDescriptor(c(), p),
    getPrototypeOf: (_) => Reflect.getPrototypeOf(c()),
    has: (_, p) => Reflect.has(c(), p),
    isExtensible: (_) => Reflect.isExtensible(c()),
    ownKeys: (_) => Reflect.ownKeys(c()),
    preventExtensions: (_) => Reflect.preventExtensions(c()),
    set: (_, p, newValue, receiver) => Reflect.set(c(), p, newValue, receiver),
    setPrototypeOf: (_, v) => Reflect.setPrototypeOf(c(), v),
  }) as T & { $current: T };
}

export function useUpdatedRaw<T>(value: T): { current: T } {
  const result = useMemo(() => ({ current: value }), []);
  result.current = value;
  return result;
}
