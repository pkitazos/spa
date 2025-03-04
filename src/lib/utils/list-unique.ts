export function unique<T>(lst: T[], compare: (a: T, b: T) => boolean) {
  return lst.filter(
    (val, idx, arr) => arr.findIndex((val2) => compare(val, val2)) === idx,
  );
}

export function uniqueById<T extends { id: string }>(lst: T[]) {
  return unique(lst, (a, b) => a.id === b.id);
}
