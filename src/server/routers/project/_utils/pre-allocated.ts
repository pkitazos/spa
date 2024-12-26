import { PrismaTransactionClient } from "@/db";
import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

export async function getPreAllocatedProjects(
  tx: PrismaTransactionClient,
  params: InstanceParams,
) {
  const projects = await tx.project.findMany({
    where: { ...expand(params), preAllocatedStudentId: { not: null } },
    select: {
      id: true,
      title: true,
      description: true,
      specialTechnicalRequirements: true,
      capacityLowerBound: true,
      capacityUpperBound: true,
      preAllocatedStudentId: true,
      supervisor: { select: { user: true } },
      latestEditDateTime: true,
      tagOnProject: { select: { tag: { select: { id: true, title: true } } } },
      flagOnProjects: {
        select: { flag: { select: { id: true, title: true } } },
      },
    },
  });

  return projects.map((p) => ({
    ...p,
    preAllocatedStudentId: p.preAllocatedStudentId!,
  }));
}
