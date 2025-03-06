import type { Grade } from "./grades-columns"

export const grades: Grade[] = [
  {
    project: "[Project A]",
    student: "[Student B]",
    supervisor: "[Supervisor C]",
    supervisorGrade: "A4",
    reader: "[Reader D]",
    readerGrade: "A2",
    status: true,
    computedOverall: "A2",
  },
  {
    project: "[Project E]",
    student: "[Student F]",
    supervisor: "[Supervisor C]",
    supervisorGrade: "A5",
    reader: "[Reader G]",
    readerGrade: "B3",
    status: false,
    action: "do more shit",
  },
  {
    project: "[Project H]",
    student: "[Student I]",
    supervisor: "[Supervisor J]",
    supervisorGrade: "A1",
    reader: "[Reader K]",
    readerGrade: "A2",
    status: false,
    action: "something",
  },
]

