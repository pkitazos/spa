export const GRADES = [
  { label: "A1", value: 22 },
  { label: "A2", value: 21 },
  { label: "A3", value: 20 },
  { label: "A4", value: 19 },
  { label: "A5", value: 18 },
  { label: "B1", value: 17 },
  { label: "B2", value: 16 },
  { label: "B3", value: 15 },
  { label: "C1", value: 14 },
  { label: "C2", value: 13 },
  { label: "C3", value: 12 },
  { label: "D1", value: 11 },
  { label: "D2", value: 10 },
  { label: "D3", value: 9 },
  { label: "E1", value: 8 },
  { label: "E2", value: 7 },
  { label: "E3", value: 6 },
  { label: "F1", value: 5 },
  { label: "F2", value: 4 },
  { label: "F3", value: 3 },
  { label: "G1", value: 2 },
  { label: "G2", value: 1 },
  { label: "H", value: 0 },
];

export function computeGrade(mark: number): string {
  const grade = GRADES.find((g) => g.value === Math.ceil(mark));
  if (!grade) throw new Error(`Computed mark not valid: ${mark}`);
  return grade.label;
}
