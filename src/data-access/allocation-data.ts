import { InstanceParams } from "@/lib/validations/params";

import { db } from "@/db";

export async function getAllAllocationData(params: InstanceParams) {
  const { group, subGroup, instance } = params;
  return await db.studentProjectAllocation.findMany({
    where: {
      allocationGroupId: group,
      allocationSubGroupId: subGroup,
      allocationInstanceId: instance,
    },
    select: {
      project: {
        select: {
          details: {
            select: {
              id: true,
              title: true,
              capacityLowerBound: true,
              capacityUpperBound: true,
            },
          },
          supervisor: {
            select: {
              projectAllocationLowerBound: true,
              projectAllocationTarget: true,
              projectAllocationUpperBound: true,
              userInInstance: {
                select: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      student: {
        select: {
          userInInstance: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      studentRanking: true,
    },
  });
}
