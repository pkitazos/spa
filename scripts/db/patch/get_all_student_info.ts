import fs from "fs";
import { expand } from "@/lib/utils/general/instance-params";
import { PrismaClient } from "@prisma/client";
import { EXCLUDED_STUDENTS_LEVEL4 } from "./data/misc/excluded_students";

const group = "socs";
const subGroup = "lvl-4-and-lvl-5-honours";
const instance = "2024-2025";

const params = { group, subGroup, instance };

const db = new PrismaClient();

const MARKING_GROUP = "seyp";
const IDX = 20; // Replace with the line number of the student you want to query
const toListIdx = (idx: number) => idx - 4;
const studentId = EXCLUDED_STUDENTS_LEVEL4[toListIdx(IDX)];

const OUTPUT_DIR = `./src/db/scripts/data/tmp/`;

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const summary = await db.studentProjectAllocation
    .findFirstOrThrow({
      where: { userId: studentId, ...expand(params) },
      include: {
        finalGrade: true,
        project: true,
        student: { include: { studentFlags: { include: { flag: true } } } },
      },
    })
    .then((a) => ({
      supervisor: a.project.supervisorId,
      finalGrade: a.finalGrade?.grade,
      studentId: a.userId,
      flagId: a.student?.studentFlags?.[0]?.flagId,
      flagTitle: a.student?.studentFlags?.[0]?.flag?.title,
    }));

  const markingSubmissions = await db.markingSubmission
    .findMany({
      where: { unitOfAssessment: { flagId: summary.flagId }, studentId },
      include: {
        criterionScores: { include: { criterion: true } },
        unitOfAssessment: true,
      },
    })
    .then((data) =>
      data.map((s) => ({
        summary: s.summary,
        grade: s.grade,
        markerId: s.markerId,
        studentId,
        unitOfAssessmentId: s.unitOfAssessmentId,
        unitOfAssessmentTitle: s.unitOfAssessment.title,
        criterionScores: s.criterionScores.map((c) => ({
          criterionTitle: c.criterion.title,
          criterionId: c.assessmentCriterionId,
          grade: c.grade,
          justification: c.justification,
        })),
      })),
    );

  console.log(`Student Summary: ${JSON.stringify(summary, null, 2)}`);

  fs.writeFileSync(
    `${OUTPUT_DIR}/${MARKING_GROUP}-${studentId}-summary.json`,
    JSON.stringify(markingSubmissions, null, 2),
  );
}

main()
  .catch(async (e: any) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
