// @JakeTrevor do these changes look right?
export function computeUpdatedRank<T extends { rank: number }>(
  arr: T[],
  targetIdx: number,
): number {
  // if the array was empty set the rank of the item to 1
  if (arr.length === 0) {
    return 1;
  }

  /**
   * The item was placed as the first element in the array
   * because of the above guard clause, we know the array has at least 1 element in it
   * the rank we need is half that of the first element
   */
  if (targetIdx === 0) {
    const after = arr[0];
    return after ? after.rank / 2 : 1;
  }

  /**
   * The item was placed as the last element in the array
   * meaning we need to know the rank of the last element in the previous version of the array
   * the rank we need is that of the current last element
   * (targetIdx points to the last element, so targetIdx-1 is the one before)
   */
  if (targetIdx >= arr.length) {
    const before = arr[arr.length - 1];
    return before ? before.rank + 1 : 1;
  }

  /**
   * finally, if the item is placed anywhere else in the array, all we need to do
   * is get the rank of the items before and at the desired position,
   * and set the updated rank to the midpoint between the two
   */
  const before = arr[targetIdx - 1];
  const after = arr[targetIdx];
  return before && after ? (before.rank + after.rank) / 2 : 1;
}
