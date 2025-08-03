export function validateCSVStructure<T>(
  data: T[],
  headers: string[] | undefined,
  requiredHeaders: string[],
): string[] {
  const fileErrors: string[] = [];

  if (!headers) {
    fileErrors.push("CSV does not contain headers");
    return fileErrors;
  }

  const expectedSet = new Set(requiredHeaders);
  const actualSet = new Set(headers);

  if (
    expectedSet.size !== actualSet.size ||
    !requiredHeaders.every((h) => actualSet.has(h))
  ) {
    fileErrors.push(
      `CSV headers do not match required format. Expected: ${requiredHeaders.join(", ")}, Got: ${headers.join(", ")}`,
    );
    return fileErrors;
  }

  if (data.length === 0) {
    fileErrors.push("CSV file is empty");
  }

  return fileErrors;
}
