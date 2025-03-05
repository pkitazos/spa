export function parseForDuplicates<
  T extends {
    student_guid: string;
    reader_guid: string;
    reader_name: string;
    reader_email: string;
  },
>(data: T[]) {
  return { uniqueRows: [] as T[], duplicateRowGuids: new Set<string>() };
}
