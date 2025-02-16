// TODO: kill

import { expand, toInstanceId } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

import { db } from "@/db";

/**
 * @deprecated use instance.fetch instead
 */
export function getAllocationInstance(params: InstanceParams) {
  return db.allocationInstance.findFirstOrThrow({
    where: toInstanceId(params),
  });
}

export async function getAllStudents(params: InstanceParams): Promise<
  {
    level: number;
    projectAllocation: { details: { id: string; title: string } } | undefined;
    id: string;
    name: string;
    email: string;
  }[]
> {
  const studentData = await db.studentDetails.findMany({
    where: expand(params),
    select: {
      userInInstance: {
        select: {
          user: true,
        },
      },
      studentLevel: true,
      projectAllocation: {
        select: {
          project: {
            select: {
              details: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return studentData.map(
    ({ userInInstance, studentLevel, projectAllocation }) => ({
      ...userInInstance.user,
      level: studentLevel,
      projectAllocation: projectAllocation?.project ?? undefined,
    }),
  );
}
