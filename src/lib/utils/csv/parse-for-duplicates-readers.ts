// TODO: ig redo this?

export function parseForDuplicates<
  T extends {
    project_title: string;
    student_guid: string;
    supervisor_guid: string;
    reader_name: string;
  },
>(_data: T[]) {
  return { uniqueRows: [], duplicateRowGuids: new Set() };

  // // record of duplicate ids
  // const duplicatedGuidsRecord = findDuplicates(data, (a) => a.student_guid);

  // // have duplicate ids
  // const ids_of_duplicate_guid_rows = new Set(
  //   data
  //     .filter((e) =>
  //       Object.keys(duplicatedGuidsRecord).includes(e.student_guid),
  //     )
  //     .map((e) => e.student_guid),
  // );

  // // record of duplicate project titles
  // const duplicatedProjectsRecord = findDuplicates(data, (a) => a.project_title);

  // // have duplicate project titles
  // const ids_of_duplicate_email_rows = new Set(
  //   data
  //     .filter((e) =>
  //       Object.keys(duplicatedProjectsRecord).includes(e.project_title),
  //     )
  //     .map((e) => e.project_title),
  // );

  // const duplicateRowGuids = ids_of_duplicate_guid_rows.union(
  //   ids_of_duplicate_email_rows,
  // );

  // const uniqueRows = data.filter((e) => !duplicateRowGuids.has(e.student_guid));

  // return { uniqueRows, duplicateRowGuids };
}
