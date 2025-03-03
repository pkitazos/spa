import { Prisma, PrismaClient, Role } from "@prisma/client";

import { InstanceParams } from "@/lib/validations/params";

import { checkUsersMembership } from "./check-users-membership";
import { NewReaderAllocation } from "@/lib/validations/allocate-readers/new-reader-allocation";
import { boolean } from "zod";

export async function assignReadersTx(
  db: PrismaClient,
  newReaderAllocations: NewReaderAllocation[],
  { group, subGroup, instance }: InstanceParams,
) {
  return await db.$transaction(async (tx) => {
    const allocations = await Promise.all(
      newReaderAllocations.map(async ({ project_title, student_guid, reader_name }) => {
        const project = await tx.project.findFirst({
          where: { title: project_title },
        });

        const readers = await tx.user.findMany({
          where: { name: reader_name },
          select: { id: true },
        });

        if (readers.length == 0) {
          console.log(`No reader. Skipping allocation for project: ${project_title}, reader: ${reader_name}`);
          return null;
        }

        let readerId;

        for (var read of readers) {
          const reader = await tx.supervisorInstanceDetails.findFirst({
            where: { userId: read.id }
          })
          if (reader) {
            readerId = read.id;
          }
        }

        const projectAlloc = await tx.projectAllocation.findFirst({
          where: { userId: student_guid}
        });
        let projectId = "";
        if (!project) {
            
            const projectNew = await tx.project.findFirst({
              where: { id: projectAlloc?.projectId }
            })
            if (!projectNew) {
              console.log(`No project. Skipping allocation for project: ${project_title}, reader: ${reader_name}`);
              return null;
            } else {
              projectId = projectNew.id;
            }
        } else {
          projectId = project.id;
        }

        if (!readerId) {
          console.log(`No reader. Skipping allocation for project: ${project_title}, reader: ${reader_name}`);
          return null;
        }

        const student = tx.studentDetails.findFirst({
          where: {
            userId: student_guid
          }
        })

        if (!student) {
          console.log(`No student. Skipping allocation for project: ${project_title}, reader: ${reader_name}, student: ${student_guid}`);
          return null;
        }

        if (student_guid!=projectAlloc?.userId) {
          console.log(`Student not assigned correct project. Skipping allocation for project: ${project_title}, reader: ${reader_name}, student: ${student_guid}`);
          return null;
        }

        if (typeof projectId !== 'string' || typeof readerId !== 'string') {
          throw new Error(`ID type mismatch for project or reader`);
        }

        return {
          allocationGroupId: group,
          allocationSubGroupId: subGroup,
          allocationInstanceId: instance,
          projectId: projectId,
          studentId: student_guid,
          readerId: readerId,
        };
      })
    );

    const validAllocations = allocations.filter(Boolean) as Prisma.ProjectAllocationReaderCreateManyInput[];

    if (validAllocations.length > 0) {
      for (var alloc of validAllocations) {
        console.log(`${alloc.projectId}\t${alloc.readerId}\t${alloc.studentId}`);
        await tx.projectAllocationReader.create({
          data: alloc
        });
    }
      /*await tx.projectAllocationReader.createMany({
        data: validAllocations,
        skipDuplicates: true,
      });*/
    } else {
      console.log("No valid allocations found to create.");
    }

    return {
      successFullyAdded: newReaderAllocations.length,
    };
  });
}
