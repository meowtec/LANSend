/* eslint-disable @typescript-eslint/no-unsafe-return */

export function watchProp<P extends string, V>(
  target: { [prop in P]: V },
  prop: P,
  callback: (oldValue: V, newValue: V) => void,
) {
  const descriptor = Object.getOwnPropertyDescriptor(target, prop) ?? {
    value: target[prop],
    writable: true,
  };

  Object.defineProperty(target, prop, {
    get() {
      if (descriptor.get) {
        return descriptor.get.call(this);
      }

      return descriptor.value;
    },

    set(v: V) {
      const oldValue = target[prop];

      if (descriptor.set) {
        descriptor.set.call(this, v);
      }

      if (descriptor.writable) {
        descriptor.value = v;
      }

      callback(oldValue, v);
    },
  });
}
