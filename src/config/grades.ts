import { GradingResult } from "@/dto/result/grading-result";

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

export class Grade {
  public static computeFromScores(scores: { score: number; weight: number }[]) {
    const totalWeight = scores.reduce((acc, val) => acc + val.weight, 0);
    const totalWeightedScore = scores.reduce(
      (acc, val) => acc + val.weight * val.score,
      0,
    );
    const mark = this.round(totalWeightedScore / totalWeight);
    return mark;
  }

  // POLICY how should we round non-integer grades?
  public static round(mark: number): number {
    return Math.round(mark);
  }

  public static toLetter(mark: number): string {
    if (mark !== Math.round(mark)) {
      throw new Error(`Mark must be an integer: ${mark}`);
    }
    const grade = GRADES.find((g) => g.value === mark);
    if (!grade) {
      console.error(`!!Invalid Grade! ${mark}`);
      return `invalid ${mark}`;
    }
    // throw new Error(`Computed mark not valid: ${mark}`);
    return grade.label;
  }

  public static toInt(grade: string): number {
    const gradeObj = GRADES.find((g) => g.label === grade);
    if (!gradeObj) {
      console.error(`!!Invalid Grade! ${grade}`);
      return -1;
    }
    // throw new Error(`Grade not valid: ${grade}`);
    return gradeObj.value;
  }

  public static getBand(grade: string): string {
    if (!GRADES.map((g) => g.label).includes(grade)) {
      throw new Error(`Grade not valid: ${grade}`);
    }
    return grade[0];
  }

  public static haveBandDifference(grade1: string, grade2: string): boolean {
    return this.getBand(grade1) === this.getBand(grade2);
  }

  // leaving in for future use
  public static isOnBoundary(grade: string): boolean {
    return ["A1", "H"].includes(grade);
  }

  // POLICY how should we round non-integer grades for between-marker averaging?
  public static average(grade1: string, grade2: string): string {
    const grade1Value = this.toInt(grade1);
    const grade2Value = this.toInt(grade2);
    const average = Math.round((grade1Value + grade2Value) / 2);
    return this.toLetter(average);
  }

  // if grade is A1 or Fail (E1 or below) then go to negotiate2
  public static boundaryCheck(grade: string) {
    if (this.isOnBoundary(grade)) {
      return { status: GradingResult.NEGOTIATE2 };
    } else {
      return { status: GradingResult.AUTO_RESOLVED, grade };
    }
  }

  public static autoResolve(supervisorGrade?: string, readerGrade?: string) {
    if (!supervisorGrade || !readerGrade) {
      return { status: GradingResult.INSUFFICIENT };
    }

    const supervisorValue = Grade.toInt(supervisorGrade);
    const readerValue = Grade.toInt(readerGrade);
    const diff = Math.abs(supervisorValue - readerValue);

    if (diff <= 1) {
      return { status: GradingResult.AUTO_RESOLVED, grade: supervisorGrade };
    }

    if (diff === 2 && !Grade.haveBandDifference(supervisorGrade, readerGrade)) {
      return {
        status: GradingResult.AUTO_RESOLVED,
        grade: Grade.average(supervisorGrade, readerGrade),
      };
    }

    if (diff === 2) {
      return { status: GradingResult.NEGOTIATE1 };
      // send emails using internal smtp server
    }

    return { status: GradingResult.NEGOTIATE2 };
  }
}
