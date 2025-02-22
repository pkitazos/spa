import { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { expand } from "@/lib/utils/general/instance-params";
import { matchingDetailsSchema } from "@/lib/validations/matching";
import { InstanceParams } from "@/lib/validations/params";

export async function getUnallocatedStudents(
  db: PrismaClient,
  params: InstanceParams,
  selectedAlgName: string,
) {
  const students = await db.studentDetails
    .findMany({
      where: expand(params),
      select: {
        studentLevel: true,
        projectAllocation: { select: { project: true } },
        userInInstance: {
          select: {
            user: true,
          },
        },
      },
    })
    .then((d) =>
      d.map((s) => ({
        student: { ...s.userInInstance.user, level: s.studentLevel },
        project: s.projectAllocation?.project,
      })),
    );

  const matchedStudentIds = await db.algorithmConfigInInstance
    .findFirstOrThrow({
      where: {
        algorithmConfig: { algName: selectedAlgName },
        ...expand(params),
      },
      include: { matchingResult: true },
    })
    .then((x) => {
      // TODO: this is not correct, the data is actually an array so we'll have to revisit this later on
      const matching = z
        .array(matchingDetailsSchema)
        .parse(JSON.parse(x.matchingResult.matching as string));

      return new Set(matching.map((m) => m.student_id));
    });

  return students.filter((s) => !matchedStudentIds.has(s.student.id));
}
