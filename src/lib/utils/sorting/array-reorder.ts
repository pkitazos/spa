/**
 *
 * @param items the array of items to reorder
 * @param from the current index of the item to move
 * @param to the index to move the item to
 * @returns
 */
export function arrayReorder<T>(items: T[], from: number, to: number): T[] {
  const too_small = from < 0 || to < 0;
  const too_large = from >= items.length || to >= items.length;
  const no_change = from === to;
  const too_few = items.length < 2;

  if (no_change || too_small || too_large || too_few) return items;

  const item = items[from];
  if (item === undefined) return items;
  return items.toSpliced(from, 1).toSpliced(to, 0, item);
}
