import { PrismaClient } from "@prisma/client";

import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";
import studentFlags from "./data/FlagOnStudent.json";

export async function student_flags(db: PrismaClient, params: InstanceParams) {
  await db.flagOnStudent.createMany({
    data: studentFlags.map((s) => ({
      ...expand(params),
      studentId: s.studentId,
      flagId: s.flagId,
    })),
    skipDuplicates: true,
  });
}
