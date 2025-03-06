import { PrismaClient } from "@prisma/client";

import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

import projectAllocations from "./data/ProjectAllocation.json";

export async function student_project_allocations(
  db: PrismaClient,
  params: InstanceParams,
) {
  const spaData = projectAllocations
    .filter(
      (x) =>
        x.allocation_group_id === params.group &&
        x.allocation_sub_group_id === params.subGroup &&
        x.allocation_instance_id === params.instance,
    )
    .map((x) => ({
      projectId: x.project_id,
      userId: x.user_id,
      studentRanking: x.student_ranking,
      ...expand(params),
    }));

  await db.$transaction([
    db.studentProjectAllocation.createMany({
      data: spaData,
      skipDuplicates: true,
    }),
  ]);
}
