// MOVE - colocate these with the CSV parsing logic, it's the only place they are used
// or alternatively, infer them from the validation schemas directly

export const addStudentsCsvHeaders = [
  "fullName",
  "institutionId",
  "email",
  "flagId",
];

export const addSupervisorsCsvHeaders = [
  "fullName",
  "institutionId",
  "email",
  "projectTarget",
  "projectUpperQuota",
];
