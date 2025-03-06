import { PrismaClient } from "@prisma/client";

import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

export async function student_flags(db: PrismaClient, params: InstanceParams) {
  await db.$transaction(async (tx) => {
    const flags = await tx.flag.findMany({ where: expand(params) });

    const flagMap = flags.reduce(
      (acc, val) => {
        if (val.title === "Software Engineering") return acc;
        const flagNum = parseInt(val.title.split("Level ")[1]);
        return { ...acc, [flagNum]: val.id };
      },
      {} as Record<number, string>,
    );

    const students = await tx.studentDetails.findMany({
      where: expand(params),
    });

    await tx.flagOnStudent.createMany({
      data: students.map((s) => ({
        ...expand(params),
        studentId: s.userId,
        flagId: flagMap[s.studentLevel],
      })),
      skipDuplicates: true,
    });
  });
}
