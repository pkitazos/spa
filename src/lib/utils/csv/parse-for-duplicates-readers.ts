type Row = {
  student_guid: string;
  reader_guid: string;
  reader_name: string;
  reader_email: string;
};

export function parseForDuplicateReaders(data: Row[]): {
  uniqueRows: Row[];
  duplicateStudentGUIDs: Set<string>;
} {
  function isDuplicate(row: Row, index: number, arr: Row[]) {
    return arr.some(
      (x, idx) => idx !== index && x.student_guid === row.student_guid,
    );
  }

  function isNotDuplicate(row: Row, index: number, arr: Row[]) {
    return !isDuplicate(row, index, arr);
  }
  const duplicateRows = data.filter(isDuplicate);

  return {
    uniqueRows: data.filter(isNotDuplicate),
    duplicateStudentGUIDs: new Set(duplicateRows.map((e) => e.student_guid)),
  };
}
