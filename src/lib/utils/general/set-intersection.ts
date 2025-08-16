/**
 *
 * @todo refactor to use compare function instead of getKey
 *
 * Computes the intersection of two sets
 * @param a set A
 * @param b set B
 * @param getKey a function to get the key of the element
 * @returns the intersection of set A and set B
 * @example
 * const a = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
 * const b = [{ id: 2, name: 'B' }, { id: 3, name: 'C' }];
 * const intersection = setIntersection(a, b, (x) => x.id);
 * console.log(intersection); // Output: [{ id: 2, name: 'B' }]
 */
export function setIntersection<T>(
  a: T[],
  b: T[],
  getKey: (a: T) => string,
): T[] {
  return a.filter((x) => b.some((y) => getKey(x) === getKey(y)));
}

export function hasOverlap<T>(
  a: T[],
  b: T[],
  getKey: (a: T) => string,
): boolean {
  return setIntersection(a, b, getKey).length > 0;
}
