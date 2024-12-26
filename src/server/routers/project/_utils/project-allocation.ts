import { PrismaTransactionClient } from "@/db";

type StudentProjectAllocationData = {
  group: string;
  subGroup: string;
  instance: string;
  preAllocatedStudentId: string;
  projectId: string;
};

export async function updateProjectAllocation(
  db: PrismaTransactionClient,
  data: StudentProjectAllocationData,
) {
  const { group, subGroup, instance, preAllocatedStudentId, projectId } = data;

  await db.userInInstance.update({
    where: {
      instanceMembership: {
        allocationGroupId: group,
        allocationSubGroupId: subGroup,
        allocationInstanceId: instance,
        userId: preAllocatedStudentId,
      },
    },
    data: {
      studentAllocation: {
        connectOrCreate: {
          where: {
            allocationId: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              userId: preAllocatedStudentId,
              projectId,
            },
          },
          create: {
            projectId,
            studentRanking: 1,
          },
        },
      },
    },
  });
}
