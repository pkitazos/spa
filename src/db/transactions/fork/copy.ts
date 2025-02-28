import { Role } from "@prisma/client";

import { expand } from "@/lib/utils/general/instance-params";
import { compareTitle } from "@/lib/utils/sorting/by-title";
import { InstanceParams } from "@/lib/validations/params";

import {
  ForkMarkedData,
  ForkMarkedProjectDto,
  ForkMarkedStudentDto,
  ForkMarkedSupervisorDto,
} from "./mark";
import { updateProjectCapacities, updateSupervisorCapacities } from "./utils";

import { TX } from "@/db/types";

export async function copy(
  tx: TX,
  forkedInstanceId: string,
  params: InstanceParams,
  markedData: ForkMarkedData,
  supervisorCounts: Record<string, number>,
  projectCounts: Record<string, number>,
) {
  await copyStudents(tx, forkedInstanceId, params, markedData.students);

  await copySupervisors(
    tx,
    forkedInstanceId,
    params,
    markedData.supervisors,
    supervisorCounts,
  );

  const projectMapping = await copyProjects(
    tx,
    forkedInstanceId,
    params,
    markedData.projects,
    projectCounts,
  );

  const flagMapping = await copyInstanceFlags(tx, forkedInstanceId, params);

  const tagMapping = await copyInstanceTags(tx, params, forkedInstanceId);

  return { project: projectMapping, flag: flagMapping, tag: tagMapping };
}

// TODO: use difference instead of upper bound to check which supervisors to copy
async function copySupervisors(
  tx: TX,
  forkedInstanceId: string,
  params: InstanceParams,
  parentInstanceSupervisors: ForkMarkedSupervisorDto[],
  supervisorCounts: Record<string, number>,
) {
  await tx.userInInstance.createMany({
    data: parentInstanceSupervisors.map((supervisor) => ({
      ...expand(params, forkedInstanceId),
      userId: supervisor.userId,
      role: Role.SUPERVISOR,
    })),
  });

  await tx.supervisorInstanceDetails.createMany({
    data: parentInstanceSupervisors.map((supervisor) => ({
      ...expand(params, forkedInstanceId),
      ...updateSupervisorCapacities(
        supervisor,
        supervisorCounts[supervisor.userId] ?? 0,
      ),
      userId: supervisor.userId,
    })),
  });
}

async function copyStudents(
  tx: TX,
  forkedInstanceId: string,
  params: InstanceParams,
  parentInstanceStudents: ForkMarkedStudentDto[],
) {
  await tx.userInInstance.createMany({
    data: parentInstanceStudents.map((student) => ({
      ...expand(params, forkedInstanceId),
      userId: student.userId,
      role: Role.STUDENT,
    })),
  });

  await tx.studentDetails.createMany({
    data: parentInstanceStudents.map((student) => ({
      ...expand(params, forkedInstanceId),
      userId: student.userId,
      studentLevel: student.studentLevel,
    })),
  });
}

async function copyProjects(
  tx: TX,
  forkedInstanceId: string,
  params: InstanceParams,
  parentInstanceProjects: ForkMarkedProjectDto[],
  projectCounts: Record<string, number>,
) {
  await tx.project.createMany({
    data: parentInstanceProjects.map((project) => ({
      ...expand(params, forkedInstanceId),
      title: project.title,
      description: project.description,
      specialTechnicalRequirements: project.specialTechnicalRequirements,
      latestEditDateTime: project.latestEditDateTime,
      supervisorId: project.supervisorId,
      ...updateProjectCapacities(
        project.capacityUpperBound,
        projectCounts[project.id] ?? 0,
      ),
    })),
  });

  const oldProjects = parentInstanceProjects.toSorted(compareTitle);

  const newProjects = await tx.project
    .findMany({ where: expand(params, forkedInstanceId) })
    .then((data) => data.toSorted(compareTitle));

  return newProjects.reduce(
    (acc, newProject, i) => {
      const oldProject = oldProjects[i];
      acc[oldProject.id] = newProject.id;
      return acc;
    },
    {} as Record<string, string>,
  );
}

export async function copyInstanceFlags(
  tx: TX,
  forkedInstanceId: string,
  params: InstanceParams,
) {
  const parentInstanceFlags = await tx.flag
    .findMany({ where: expand(params) })
    .then((data) => data.toSorted(compareTitle));

  await tx.flag.createMany({
    data: parentInstanceFlags.map(({ title }) => ({
      ...expand(params, forkedInstanceId),
      title,
    })),
  });

  const newFlags = await tx.flag
    .findMany({ where: expand(params, forkedInstanceId) })
    .then((data) => data.toSorted(compareTitle));

  return newFlags.reduce(
    (acc, newFlag, i) => {
      const oldFlag = parentInstanceFlags[i];
      acc[oldFlag.id] = newFlag.id;
      return acc;
    },
    {} as Record<string, string>,
  );
}

export async function copyInstanceTags(
  tx: TX,
  params: InstanceParams,
  forkedInstanceId: string,
) {
  const parentInstanceTags = await tx.tag
    .findMany({ where: expand(params) })
    .then((data) => data.toSorted(compareTitle));

  await tx.tag.createMany({
    data: parentInstanceTags.map(({ title }) => ({
      ...expand(params, forkedInstanceId),
      title,
    })),
  });

  const newTags = await tx.tag
    .findMany({ where: expand(params, forkedInstanceId) })
    .then((data) => data.toSorted(compareTitle));

  return newTags.reduce(
    (acc, newTag, i) => {
      const oldFlag = parentInstanceTags[i];
      acc[oldFlag.id] = newTag.id;
      return acc;
    },
    {} as Record<string, string>,
  );
}

export type MappingData = Awaited<ReturnType<typeof copy>>;
