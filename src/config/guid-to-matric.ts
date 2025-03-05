export function guidToMatric(id: string): string {
  const matric = id.slice(0, -1);
  // if (/\d/.test(matric)) {
  //   throw new Error(`Invalid Student GUID: ${id}`);
  // }
  return matric;
}
