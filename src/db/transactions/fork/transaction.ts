import { PrismaClient } from "@prisma/client";

import { slugify } from "@/lib/utils/general/slugify";
import { ForkedInstanceDetails } from "@/lib/validations/instance-form";
import { InstanceParams } from "@/lib/validations/params";

import { copy } from "./copy";
import { link } from "./link";
import { mark } from "./mark";
import { getProjectAllocationCount, getSupervisorAllocations } from "./utils";

export async function forkInstanceTransaction(
  db: PrismaClient,
  forked: ForkedInstanceDetails,
  params: InstanceParams,
) {
  const forkedInstanceId = slugify(forked.displayName);

  await db.$transaction(async (tx) => {
    const parentInstance = await tx.allocationInstance.findFirstOrThrow({
      where: {
        allocationGroupId: params.group,
        allocationSubGroupId: params.subGroup,
        id: params.instance,
      },
    });

    await tx.allocationInstance.create({
      data: {
        allocationGroupId: params.group,
        allocationSubGroupId: params.subGroup,
        id: forkedInstanceId,
        parentInstanceId: params.instance,
        displayName: forked.displayName,
        projectSubmissionDeadline: forked.projectSubmissionDeadline,
        studentPreferenceSubmissionDeadline:
          forked.studentPreferenceSubmissionDeadline,
        minStudentPreferences: parentInstance.minStudentPreferences,
        maxStudentPreferences: parentInstance.maxStudentPreferences,
        maxStudentPreferencesPerSupervisor:
          parentInstance.maxStudentPreferencesPerSupervisor,
        minReaderPreferences: parentInstance.minReaderPreferences,
        maxReaderPreferences: parentInstance.maxReaderPreferences,
        readerPreferenceSubmissionDeadline:
          parentInstance.readerPreferenceSubmissionDeadline,
      },
    });

    const supervisorCounts = await getSupervisorAllocations(tx, params);
    const projectCounts = await getProjectAllocationCount(tx, params);

    const markedData = await mark(tx, params, supervisorCounts, projectCounts);

    const mappings = await copy(
      tx,
      forkedInstanceId,
      params,
      markedData,
      supervisorCounts,
      projectCounts,
    );

    await link(tx, markedData.projects, mappings);
  });
}
