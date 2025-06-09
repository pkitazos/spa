import { PrismaClient } from "@prisma/client";
import { DB } from "../types";
import {
  LEVEL4_CONFIG,
  SEYP_CONFIG,
  UnitOfAssessmentConfigType,
} from "./misc/units_of_assessment_by_flag";
import { writeToJsonFile } from "./write-to-json";

const group = "socs";
const subGroup = "lvl-4-and-lvl-5-honours";
const instance = "2024-2025";

const params = { group, subGroup, instance };

const db = new PrismaClient();

async function main() {
  await get_projects(db, LEVEL4_CONFIG);
  await get_projects(db, SEYP_CONFIG);
}

async function get_projects(db: DB, config: UnitOfAssessmentConfigType) {
  const output_dir = `docs/tmp/reports/${config.MARKING_GROUP}`;

  const spas = await db.studentProjectAllocation
    .findMany({
      where: { student: { studentFlags: { every: { flagId: config._ID } } } },
      include: { project: true },
    })
    .then((as) =>
      as.map((a) => ({
        supervisorId: a.project.supervisorId,
        studentId: a.userId,
        projectId: a.projectId,
      })),
    );

  const studentIds = spas.map((spa) => spa.studentId);

  const studentsMap = await db.studentDetails
    .findMany({ where: { userId: { in: studentIds } } })
    .then((students) => {
      return Object.fromEntries(
        students.map((student) => [student.userId, student]),
      );
    });

  const studentToSupervisorObj = Object.fromEntries(
    spas.map((spa) => [spa.studentId, spa.supervisorId]),
  );

  writeToJsonFile(
    studentToSupervisorObj,
    "student_to_supervisor_map",
    `${output_dir}/maps`,
  );

  const rpas = await db.readerProjectAllocation.findMany({
    where: { studentId: { in: studentIds } },
    include: { project: true, reader: true },
  });

  const studentIdToReaderIdMap = new Map<string, string | null>();

  rpas.forEach((rpa) => {
    if (rpa.reader) {
      studentIdToReaderIdMap.set(rpa.studentId, rpa.reader.userId);
    } else {
      console.log(
        `No reader found for student ${rpa.studentId} in project ${rpa.project.id}`,
      );
      studentIdToReaderIdMap.set(rpa.studentId, null);
    }
  });

  const studentToReaderObj = Object.fromEntries(studentIdToReaderIdMap);

  writeToJsonFile(
    studentToReaderObj,
    "student_to_reader_map",
    `${output_dir}/maps`,
  );

  type CriterionStuff = {
    id: string;
    unitOfAssessmentId: string;
    title: string;
    description: string;
    weight: number;
    layoutIndex: number;
    markerId: string;
    grade: number;
  };

  async function getFinalGrades(unitOfAssessmentId: string) {
    return await db.finalUnitOfAssessmentGrade
      .findMany({
        where: { unitOfAssessmentId, studentId: { in: studentIds } },
      })
      .then((data) =>
        data.reduce(
          (acc, f) => ({
            ...acc,
            [f.studentId]: {
              [f.unitOfAssessmentId]: {
                finalUnitGrade: f.grade,
                finalUnitComment: f.comment,
              },
            },
          }),
          {} as Record<
            string,
            Record<
              string,
              { finalUnitGrade: number; finalUnitComment: string | null }
            >
          >,
        ),
      );
  }

  const finalGradeMap = await getFinalGrades(config.DISSERTATION._ID);

  async function getCriterionGrades(
    criterionId: string,
  ): Promise<CriterionStuff[]> {
    return await db.criterionScore
      .findMany({
        where: {
          assessmentCriterionId: criterionId,
          studentId: { in: studentIds },
        },
        include: { criterion: true, submission: true },
      })
      .then((scores) =>
        scores.map((score) => ({
          id: score.criterion.id,
          unitOfAssessmentId: score.criterion.unitOfAssessmentId,
          title: score.criterion.title,
          description: "",
          weight: score.criterion.weight,
          layoutIndex: 0,
          grade: score.grade,
          justification: score.justification,
          markerId: score.markerId,
          studentId: score.studentId,
          supervisorId: studentToSupervisorObj[score.studentId],
          submissionComments: score.submission.summary,
          submissionGrade: score.submission.grade,
          finalUnitGrade:
            finalGradeMap[score.studentId]?.[
              score.criterion.unitOfAssessmentId
            ],
        })),
      );
  }

  await getCriterionGrades(config.CONDUCT.CONDUCT).then((grades) => {
    writeToJsonFile(grades, "conduct_grades", `${output_dir}/grades`);
  });

  await getCriterionGrades(config.PRESENTATION.CONTENT).then((grades) => {
    writeToJsonFile(
      grades,
      "presentation_content_grades",
      `${output_dir}/grades`,
    );
  });

  await getCriterionGrades(config.PRESENTATION.DELIVERY).then((grades) => {
    writeToJsonFile(
      grades,
      "presentation_delivery_grades",
      `${output_dir}/grades`,
    );
  });

  await getCriterionGrades(config.PRESENTATION.VISUAL_AIDS).then((grades) => {
    writeToJsonFile(
      grades,
      "presentation_visual_aids_grades",
      `${output_dir}/grades`,
    );
  });

  await getCriterionGrades(config.DISSERTATION.ANALYSIS).then((grades) => {
    writeToJsonFile(
      grades,
      "dissertation_analysis_grades",
      `${output_dir}/grades`,
    );
  });

  await getCriterionGrades(config.DISSERTATION.EVALUATION).then((grades) => {
    writeToJsonFile(
      grades,
      "dissertation_evaluation_grades",
      `${output_dir}/grades`,
    );
  });

  await getCriterionGrades(config.DISSERTATION.DISSERTATION_QUALITY).then(
    (grades) => {
      writeToJsonFile(
        grades,
        "dissertation_quality_grades",
        `${output_dir}/grades`,
      );
    },
  );

  await getCriterionGrades(config.DISSERTATION.DESIGN).then((grades) => {
    writeToJsonFile(
      grades,
      "dissertation_design_grades",
      `${output_dir}/grades`,
    );
  });
}

main()
  .catch(async (e: any) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
