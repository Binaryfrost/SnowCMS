import DTO from './DTO';

const ERRORS = {
  modify: (prop) =>
    `Property '${String(prop)}' cannot be modified on a ReadOnly DTO`,
  delete: (prop) =>
    `Property '${String(prop)}' cannot be deleted on a ReadOnly DTO`
};

/**
 * Creates a deep read-only proxy for DTOs.
 *
 * Assumes the source graph does not contain frozen properties
 * holding objects that need to be wrapped, or exotic objects
 * such as Map, Set, Date, or typed arrays.
 *
 * @template {DTO} T
 * @param {T} obj
 * @returns {import('../external-types.ts')._DeepReadonlyObject<T>}
 */
export default function ReadOnlyDTO(obj) {
  const cache = new WeakMap();

  function wrap(target) {
    if (target === null || typeof target !== 'object') {
      return target;
    }

    const cached = cache.get(target);
    if (cached) return cached;

    const proxy = new Proxy(target, {
      get(target, prop, receiver) {
        return wrap(Reflect.get(target, prop, receiver));
      },

      set(target, prop) {
        throw new Error(ERRORS.modify(prop));
      },

      deleteProperty(target, prop) {
        throw new Error(ERRORS.delete(prop));
      },

      defineProperty(target, prop) {
        throw new Error(ERRORS.modify(prop));
      }
    });

    cache.set(target, proxy);
    return proxy;
  }

  return wrap(obj);
}
