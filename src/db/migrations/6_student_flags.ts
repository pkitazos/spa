import { PrismaClient } from "@prisma/client";

import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";
import studentFlags from "./data/FlagOnStudent.json";

export async function student_flags(db: PrismaClient, params: InstanceParams) {
  const usersInInstance = await db.userInInstance.findMany({
    where: expand(params),
  });

  const users = await db.user.findMany({});

  const flags = await db.flag.findMany({ where: { ...expand(params) } });

  const userInInstanceIds = usersInInstance.reduce(
    (acc, x) => acc.add(x.userId),
    new Set<string>(),
  );

  const data = studentFlags.flatMap((s) => {
    const user = users.find((u) => u.id === s.studentId);

    const student = userInInstanceIds.has(s.studentId);

    const flag = flags.find((f) => f.id === s.flagId);

    if (!user) {
      console.log(`User ${s.studentId} not found in users`);
      return [];
    }

    if (!student) {
      console.log(`Student ${s.studentId} not found in instance`);
      return [];
    }

    if (!flag) {
      console.log(`Flag ${s.flagId} not found in instance`);
      return [];
    }

    return [{ ...expand(params), studentId: s.studentId, flagId: s.flagId }];
  });

  for (let row of data) {
    try {
      await db.flagOnStudent.create({ data: row });
    } catch (e) {
      console.log(row);
      throw e;
    }
  }
}
