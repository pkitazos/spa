import { PrismaClient } from "@prisma/client";

import { InstanceParams } from "@/lib/validations/params";
import { expand } from "@/lib/utils/general/instance-params";
import { DB_User } from "../types";
import readerAssignments from "./data/ReaderAssignments.json";

export async function reader_details(db: PrismaClient, params: InstanceParams) {
  const someData: { student_guid: string; reader_name: string }[] = [];

  await db.$transaction(async (tx) => {
    const users = await tx.userInInstance
      .findMany({ where: expand(params), include: { user: true } })
      .then((users) => users.map((u) => u.user));

    const nameToUser = users.reduce(
      (acc, user) => {
        acc[user.name] = user;
        return acc;
      },
      {} as Record<string, DB_User>,
    );

    await tx.readerDetails.createMany({
      data: readerAssignments
        .filter((x) => {
          const hello = nameToUser[x.reader_name] !== undefined;
          if (!hello) {
            console.log(
              "User",
              x.reader_name,
              "has no id:",
              nameToUser[x.reader_name],
            );
          }

          return hello;
        })
        .map((d) => ({
          ...expand(params),
          userId: nameToUser[d.reader_name].id,
          projectAllocationLowerBound: 0,
          projectAllocationTarget: 5,
          projectAllocationUpperBound: 10,
        })),
      skipDuplicates: true,
    });

    const projects = await tx.studentProjectAllocation.findMany({
      where: expand(params),
    });

    const studentIdToProjectId = projects.reduce(
      (acc, a) => {
        acc[a.userId] = a.projectId;
        return acc;
      },
      {} as Record<string, string>,
    );

    await tx.readerProjectAllocation.createMany({
      data: readerAssignments
        .filter((x) => {
          const hello = nameToUser[x.reader_name] !== undefined;
          if (!hello) {
            console.log(
              `User ${x.reader_name} has no id: ${nameToUser[x.reader_name]}`,
            );
          }

          const hello2 = studentIdToProjectId[x.student_guid] !== undefined;
          if (!hello2) {
            console.log(
              `student ${x.student_guid} no longer allocated project in instance`,
            );
          }

          return hello && hello2;
        })
        .map((d) => ({
          ...expand(params),
          readerId: nameToUser[d.reader_name].id,
          studentId: d.student_guid,
          projectId: studentIdToProjectId[d.student_guid],
        })),
      skipDuplicates: true,
    });
  });
}
