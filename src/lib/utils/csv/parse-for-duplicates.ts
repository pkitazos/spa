function isDuplicate<T extends { institutionId: string; email: string }>(
  row: T,
  index: number,
  arr: T[],
) {
  return arr.some(
    (x, idx) =>
      idx !== index &&
      (x.institutionId === row.institutionId || x.email === row.email),
  );
}

function isNotDuplicate<T extends { institutionId: string; email: string }>(
  row: T,
  index: number,
  arr: T[],
) {
  return !isDuplicate(row, index, arr);
}

export function parseForDuplicates<
  T extends { institutionId: string; email: string },
>(data: T[]) {
  const duplicateRows = data.filter(isDuplicate);

  return {
    uniqueRows: data.filter(isNotDuplicate),
    duplicateRowInstitutionIds: duplicateRows.map((row) => row.institutionId),
  };
}
