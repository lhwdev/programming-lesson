type Merged<Base extends object, Other extends object> = Readonly<Omit<Base, keyof Other> & Other>;

function readonly(action: string, name: any): never {
  throw new TypeError(`Cannot ${action} property ${name}, merged object is readonly`);
}

function withOtherProto(base: object, otherProto: object): object {
  return new Proxy(base, {
    getPrototypeOf(target) {
      const baseProto = Reflect.getPrototypeOf(target);
      if(!baseProto) return otherProto;
      return withOtherProto(baseProto, otherProto);
    },
  });
}

export function mergeObject<Base extends object, Other extends object>(
  base: Base,
  other: Other,
): Merged<Base, Other> {
  return new Proxy(base, {
    apply: (_, thisArg, argArray) => thisArg(argArray), // throws error
    construct: (_, argArray, newTarget) => newTarget(argArray), // throw error
    defineProperty: (_, property, _attributes) => readonly("define", property),
    deleteProperty: (_, p) => readonly("delete", p),
    get: (_, p, receiver) =>
      Reflect.has(other, p) ? Reflect.get(other, p, receiver) : Reflect.get(base, p, receiver),
    getOwnPropertyDescriptor: (_, p) =>
      Reflect.has(other, p) ? Reflect.getOwnPropertyDescriptor(other, p) : Reflect.getOwnPropertyDescriptor(base, p),
    getPrototypeOf: (_) => {
      const baseProto = Reflect.getPrototypeOf(base);
      const otherProto = Reflect.getPrototypeOf(other);

      if(baseProto === otherProto) return baseProto;

      if(baseProto && otherProto) {
        const objectProto = Object.prototype;
        if(baseProto === objectProto) {
          return withOtherProto(otherProto, objectProto);
        }
        if(otherProto === objectProto) {
          return withOtherProto(baseProto, objectProto);
        }
        return withOtherProto(otherProto, baseProto);
      }
      return otherProto ?? baseProto;
    },
    has: (_, p) => Reflect.has(other, p) || Reflect.has(base, p),
    isExtensible: (_) => false,
    ownKeys: (_) => {
      const result = new Set<string | symbol>();
      for(const key of Reflect.ownKeys(other)) result.add(key);
      for(const key of Reflect.ownKeys(base)) result.add(key);
      return Array.from(result.values());
    },
    preventExtensions: (_) => true,
    set: (_, p, _newValue, _receiver) => readonly("set", p),
    setPrototypeOf: (_, _v) => { throw new TypeError("Cannot set prototype, merged object is readonly"); },
  }) as Merged<Base, Other>;
}
