/* eslint-disable @typescript-eslint/no-unused-vars */
import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

import { MergeMarkedData } from "./mark";

import { Role } from "@/db/types";
import { TX } from "@/db/types";

export async function copy(
  tx: TX,
  parentInstanceId: string,
  params: InstanceParams,
  markedData: MergeMarkedData,
): Promise<void> {
  const parentInstanceParams = { ...params, instance: parentInstanceId };

  await createNewStudents(tx, parentInstanceParams, markedData.newStudents);

  await createNewSupervisors(
    tx,
    parentInstanceParams,
    markedData.newSupervisors,
  );

  await createNewFlags(tx, parentInstanceParams, markedData.newFlags);

  await createNewTags(tx, parentInstanceParams, markedData.newTags);

  const updatedProjects = await createUpdatedProjects(
    tx,
    parentInstanceParams,
    markedData.updatedProjects,
  );

  const newProjects = await createNewProjects(
    tx,
    parentInstanceParams,
    markedData.newProjects,
  );

  const projectMap = generateTitleMap([...updatedProjects, ...newProjects]);

  const flagMap = await generateFlagMap(
    tx,
    parentInstanceParams,
    markedData.newFlagOnProjects,
  );

  const tagMap = await generateTagMap(
    tx,
    parentInstanceParams,
    markedData.newTagOnProjects,
  );

  await createNewFlagOnProjects(
    tx,
    markedData.newFlagOnProjects,
    projectMap,
    flagMap,
  );

  await createNewTagOnProjects(
    tx,
    markedData.newTagOnProjects,
    projectMap,
    tagMap,
  );

  await createUpdatedPreferences(
    tx,
    parentInstanceParams,
    [...markedData.newStudents, ...markedData.updatedStudents],
    projectMap,
  );

  await createUpdatedProjectAllocations(
    tx,
    parentInstanceParams,
    markedData.newAllocations,
    projectMap,
  );

  await tx.allocationInstance.delete({
    where: {
      instanceId: {
        allocationGroupId: params.group,
        allocationSubGroupId: params.subGroup,
        id: params.instance,
      },
    },
  });
}

async function generateStudentRecords(
  params: InstanceParams, // parent instance params
  students: MergeMarkedData["newStudents"],
) {
  return students.map((student) => ({
    userId: student.id,
    role: Role.STUDENT,
    joined: true,
    ...expand(params),
  }));
}

async function generateStudentDetailsRecords(
  params: InstanceParams, // parent instance params
  students: MergeMarkedData["newStudents"],
) {
  return students.map((student) => ({
    userId: student.id,
    studentLevel: student.level,
    submittedPreferences: true,
    ...expand(params),
  }));
}

async function createNewStudents(
  tx: TX,
  params: InstanceParams, // parent instance params
  students: MergeMarkedData["newStudents"],
) {
  const studentRecords = await generateStudentRecords(params, students);
  await tx.userInInstance.createMany({ data: studentRecords });

  const studentDetailsRecords = await generateStudentDetailsRecords(
    params,
    students,
  );
  await tx.studentDetails.createMany({ data: studentDetailsRecords });
}

async function generateSupervisorRecords(
  params: InstanceParams, // parent instance params
  supervisors: MergeMarkedData["newSupervisors"],
) {
  return supervisors.map((supervisor) => ({
    userId: supervisor.id,
    role: Role.SUPERVISOR,
    joined: true,
    ...expand(params),
  }));
}

async function generateSupervisorDetailsRecords(
  params: InstanceParams, // parent instance params
  supervisors: MergeMarkedData["newSupervisors"],
) {
  return supervisors.map((supervisor) => ({
    userId: supervisor.id,
    projectAllocationLowerBound: 0,
    projectAllocationTarget: supervisor.projectAllocationTarget,
    projectAllocationUpperBound: supervisor.projectAllocationUpperBound,
    ...expand(params),
  }));
}

async function createNewSupervisors(
  tx: TX,
  params: InstanceParams, // parent instance params
  supervisors: MergeMarkedData["newSupervisors"],
) {
  const supervisorRecords = await generateSupervisorRecords(
    params,
    supervisors,
  );
  await tx.userInInstance.createMany({ data: supervisorRecords });

  const supervisorDetailsRecords = await generateSupervisorDetailsRecords(
    params,
    supervisors,
  );
  await tx.supervisorDetails.createMany({ data: supervisorDetailsRecords });
}

async function createNewFlags(
  tx: TX,
  params: InstanceParams, // parent instance params,
  flags: MergeMarkedData["newFlags"],
) {
  const flagRecords = flags.map((flag) => ({
    title: flag.title,
    ...expand(params),
  }));

  await tx.flag.createMany({
    data: flagRecords.map((f) => ({ ...f, description: "" })),
    skipDuplicates: true,
  });
}

async function createNewTags(
  tx: TX,
  params: InstanceParams, // parent instance params,
  tags: MergeMarkedData["newTags"],
) {
  const tagRecords = tags.map((tag) => ({
    title: tag.title,
    ...expand(params),
  }));

  await tx.tag.createMany({ data: tagRecords, skipDuplicates: true });
}

async function generateProjectRecords(
  projects: MergeMarkedData["updatedProjects"] | MergeMarkedData["newProjects"],
) {
  return projects.map((project) => ({
    title: project.title,
    description: project.description,
    supervisorId: project.supervisorId,
    capacityLowerBound: 0,
    capacityUpperBound: project.capacityUpperBound,
  }));
}

async function createUpdatedProjects(
  tx: TX,
  params: InstanceParams, // parent instance params
  projects: MergeMarkedData["updatedProjects"],
) {
  const projectRecords = await generateProjectRecords(projects);

  const affectedParentInstanceProjects = await tx.project.findMany({
    where: {
      ...expand(params),
      title: { in: projectRecords.map((p) => p.title) },
    },
  });

  for (const project of affectedParentInstanceProjects) {
    const projectRecord = projectRecords.find((p) => p.title === project.title);

    if (projectRecord) {
      await tx.project.update({
        where: { id: project.id },
        data: projectRecord, // ! does not handle capacity changes
      });
    }
  }

  return await tx.project.findMany({
    where: {
      ...expand(params),
      title: { in: projectRecords.map((p) => p.title) },
    },
  });
}

async function createNewProjects(
  tx: TX,
  params: InstanceParams, // parent instance params
  projects: MergeMarkedData["newProjects"],
) {
  const projectRecords = await generateProjectRecords(projects);

  await tx.project.createMany({
    data: projectRecords.map((p) => ({ ...p, ...expand(params) })),
  });

  return await tx.project.findMany({
    where: {
      ...expand(params),
      title: { in: projectRecords.map((p) => p.title) },
    },
  });
}

function generateTitleMap<T extends { id: string; title: string }>(
  items: T[],
): Record<string, string> {
  return items.reduce(
    (acc, item) => {
      acc[item.title] = item.id;
      return acc;
    },
    {} as Record<string, string>,
  );
}

async function generateFlagMap(
  tx: TX,
  params: InstanceParams,
  flagOnProjects: MergeMarkedData["newFlagOnProjects"],
) {
  const flags = await tx.flag.findMany({
    where: {
      ...expand(params),
      title: { in: flagOnProjects.map((f) => f.flagTitle) },
    },
  });

  return generateTitleMap(flags);
}

async function generateTagMap(
  tx: TX,
  params: InstanceParams,
  tagOnProjects: MergeMarkedData["newTagOnProjects"],
) {
  const tags = await tx.tag.findMany({
    where: {
      ...expand(params),
      title: { in: tagOnProjects.map((t) => t.tagTitle) },
    },
  });

  return generateTitleMap(tags);
}

async function createNewFlagOnProjects(
  tx: TX,
  flagOnProjects: MergeMarkedData["newFlagOnProjects"],
  projectMap: Record<string, string>,
  flagMap: Record<string, string>,
) {
  const flagOnProjectRecords = flagOnProjects.map((flagOnProject) => ({
    flagId: flagMap[flagOnProject.flagTitle],
    projectId: projectMap[flagOnProject.projectTitle],
  }));

  await tx.flagOnProject.createMany({ data: flagOnProjectRecords });
}

async function createNewTagOnProjects(
  tx: TX,
  tagOnProjects: MergeMarkedData["newTagOnProjects"],
  projectMap: Record<string, string>,
  tagMap: Record<string, string>,
) {
  const tagOnProjectRecords = tagOnProjects.map((tagOnProject) => ({
    tagId: tagMap[tagOnProject.tagTitle],
    projectId: projectMap[tagOnProject.projectTitle],
  }));

  await tx.tagOnProject.createMany({ data: tagOnProjectRecords });
}

async function createUpdatedPreferences(
  tx: TX,
  params: InstanceParams, // parent instance params
  students: MergeMarkedData["newStudents"] & MergeMarkedData["updatedStudents"],
  projectMap: Record<string, string>,
) {
  const updatedPreferences = students.flatMap((student) =>
    student.submittedPreferences.map((preference) => ({
      userId: student.id,
      projectId: projectMap[preference.projectTitle],
      rank: preference.rank,
      ...expand(params),
    })),
  );

  await tx.studentSubmittedPreference.deleteMany({
    where: {
      ...expand(params),
      userId: { in: students.map((student) => student.id) },
    },
  });

  await tx.studentSubmittedPreference.createMany({ data: updatedPreferences });
}

async function createUpdatedProjectAllocations(
  tx: TX,
  params: InstanceParams, // parent instance params
  projects: MergeMarkedData["newAllocations"],
  projectMap: Record<string, string>,
) {
  const newAllocations = projects.map((a) => ({
    projectId: projectMap[a.projectTitle],
    userId: a.studentId,
    studentRanking: a.rank,
    ...expand(params),
  }));

  await tx.studentProjectAllocation.createMany({ data: newAllocations });
}
