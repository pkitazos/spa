import { expand } from "@/lib/utils/general/instance-params";
import { getRandomInt } from "@/lib/utils/general/random";
import { InstanceParams } from "@/lib/validations/params";

import { DB } from "../types";

import { updateAllocation } from "@/db/transactions/update-allocation";

export async function randomAllocationTrx(
  db: DB,
  params: InstanceParams,
  studentId: string,
) {
  await db.$transaction(async (tx) => {
    const { studentLevel } = await tx.studentDetails.findFirstOrThrow({
      where: { ...expand(params), userId: studentId },
      select: { studentLevel: true },
    });

    const allProjects = await tx.project
      .findMany({
        where: { ...expand(params) },
        select: {
          id: true,
          title: true,
          allocations: true,
          flagOnProjects: {
            select: { flag: { select: { id: true, title: true } } },
          },
        },
      })
      .then((data) =>
        data
          .filter((p) => p.allocations.length === 0)
          .map((p) => ({
            id: p.id,
            title: p.title,
            flag: p.flagOnProjects.map((f) => f.flag),
          })),
      );

    const suitableProjects = allProjects.filter((p) =>
      p.flag.map((f) => f.title).includes(`Level ${studentLevel}`),
    );

    const randomIdx = getRandomInt(suitableProjects.length - 1);

    const randomAllocation = suitableProjects[randomIdx];

    // TODO: check if upsert works

    await updateAllocation(tx, params, studentId);

    await tx.savedPreference.deleteMany({
      where: { ...expand(params), userId: studentId },
    });

    await tx.savedPreference.create({
      data: {
        ...expand(params),
        projectId: randomAllocation.id,
        userId: studentId,
        rank: 1,
      },
    });

    await tx.projectAllocation.create({
      data: {
        projectId: randomAllocation.id,
        userId: studentId,
        allocationGroupId: params.group,
        allocationSubGroupId: params.subGroup,
        allocationInstanceId: params.instance,
        studentRanking: 1,
      },
    });
  });
}
