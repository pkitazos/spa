import { PrismaClient } from "@prisma/client";
import { Transformers as T } from "@/db/transformers";
import { expand } from "@/lib/utils/general/instance-params";
import { LEVEL4_CONFIG } from "./misc/units_of_assessment_by_flag";
const group = "socs";
const subGroup = "lvl-4-and-lvl-5-honours";
const instance = "2024-2025";

const params = { group, subGroup, instance };

const db = new PrismaClient();

const CONFIG = LEVEL4_CONFIG;
const MARKING_GROUP = CONFIG.MARKING_GROUP;
const OUTPUT_DIR = `./src/db/scripts/maps/${MARKING_GROUP}`;

async function main() {
  const fs = await import("fs/promises");

  const spas = await db.studentProjectAllocation
    .findMany({
      where: { student: { studentFlags: { every: { flagId: CONFIG._ID } } } },
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

  const studentsArray = await db.studentDetails.findMany({
    where: { userId: { in: studentIds }, ...expand(params) },
    include: {
      studentFlags: { include: { flag: true } },
      userInInstance: { include: { user: true } },
    },
  });

  const studentsMap = Object.fromEntries(
    studentsArray.map((student) => [student.userId, T.toStudentDTO(student)]),
  );

  const supervisorIds = spas.map((spa) => spa.supervisorId).filter(Boolean);

  const supervisorsArray = await db.supervisorDetails.findMany({
    where: { userId: { in: supervisorIds }, ...expand(params) },
    include: { userInInstance: { include: { user: true } } },
  });

  const supervisorsMap = Object.fromEntries(
    supervisorsArray.map((supervisor) => [
      supervisor.userId,
      T.toSupervisorDTO(supervisor),
    ]),
  );

  const rpas = await db.readerProjectAllocation.findMany({
    where: { studentId: { in: studentIds } },
    include: { project: true, reader: true },
  });

  const readerIds = rpas.map((rpa) => rpa.readerId).filter(Boolean);

  const readersArray = await db.readerDetails.findMany({
    where: { userId: { in: readerIds }, ...expand(params) },
    include: { userInInstance: { include: { user: true } } },
  });

  const readersMap = Object.fromEntries(
    readersArray.map((reader) => [reader.userId, T.toReaderDTO(reader)]),
  );

  const projectIds = spas.map((spa) => spa.projectId).filter(Boolean);

  const projectsArray = await db.project.findMany({
    where: { id: { in: projectIds } },
    include: {
      flagsOnProject: { include: { flag: true } },
      tagsOnProject: { include: { tag: true } },
    },
  });

  const projectsMap = Object.fromEntries(
    projectsArray.map((project) => [project.id, T.toProjectDTO(project)]),
  );

  const studentToProjectMap = Object.fromEntries(
    spas.map((spa) => [spa.studentId, spa.projectId]),
  );

  const grades = await db.finalGrade.findMany({
    where: { studentId: { in: studentIds }, ...expand(params) },
  });

  const finalMarkMap: { [studentId: string]: number } = {};

  grades.forEach((g) => {
    finalMarkMap[g.studentId] = g.grade;
  });

  await fs.writeFile(
    `${OUTPUT_DIR}/finalMarkMap.ts`,
    `export const FINAL_MARK_MAP: {[studentId: string]: number} = ${JSON.stringify(finalMarkMap, null, 2)};`,
  );

  await fs.writeFile(
    `${OUTPUT_DIR}/projectsMap.ts`,
    `import { ProjectDTO } from "@/dto";\n
    export const PROJECTS_MAP: {[projectId: string]: ProjectDTO} = ${JSON.stringify(projectsMap, null, 2)};`,
  );

  await fs.writeFile(
    `${OUTPUT_DIR}/readersMap.ts`,
    `import { ReaderDTO } from "@/dto";\n
    export const READERS_MAP: {[studentId: string]: ReaderDTO} = ${JSON.stringify(readersMap, null, 2)};`,
  );

  await fs.writeFile(
    `${OUTPUT_DIR}/spaMap.ts`,
    `export const SPA_MAP: {[studentId: string]: number} = ${JSON.stringify(studentToProjectMap, null, 2)};`,
  );

  await fs.writeFile(
    `${OUTPUT_DIR}/studentsMap.ts`,
    `import { StudentDTO } from "@/dto";\n
    export const STUDENTS_MAP: {[studentId: string]: StudentDTO} = ${JSON.stringify(studentsMap, null, 2)};`,
  );

  await fs.writeFile(
    `${OUTPUT_DIR}/supervisorsMap.ts`,
    `import { SupervisorDTO } from "@/dto";\n
    export const SUPERVISORS_MAP: {[studentId: string]: SupervisorDTO} = ${JSON.stringify(supervisorsMap, null, 2)};`,
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
