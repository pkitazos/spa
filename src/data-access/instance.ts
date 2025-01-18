// TODO: deprecate
import { Stage } from "@prisma/client";

import { expand, toInstanceId } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

import { db } from "@/db";

export function checkAllocationInstanceExists(params: InstanceParams) {
  return db.allocationInstance.findFirst({ where: toInstanceId(params) });
}

/**
 * @deprecated use instance.fetch instead
 */
export function getAllocationInstance(params: InstanceParams) {
  return db.allocationInstance.findFirstOrThrow({
    where: toInstanceId(params),
  });
}

export function updateAllocationInstanceStage(
  params: InstanceParams,
  stage: Stage,
) {
  return db.allocationInstance.update({
    where: { instanceId: toInstanceId(params) },
    data: { stage },
  });
}

export async function getSelectedAlgorithm_fromDB(
  params: InstanceParams,
  selectedAlgName: string,
) {
  return await db.algorithmConfig.findFirstOrThrow({
    where: { ...expand(params), algName: selectedAlgName },
  });
}

export async function getAllocationInstanceWithFlagsAndTags(
  params: InstanceParams,
) {
  return await db.allocationInstance.findFirstOrThrow({
    where: toInstanceId(params),
    include: { flags: true, tags: true },
  });
}

export async function getAllStudents(params: InstanceParams) {
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

export async function getAllSupervisors(params: InstanceParams) {
  const supervisors = await db.supervisorDetails.findMany({
    where: expand(params),
    select: {
      userInInstance: { select: { user: true } },
      projectAllocationTarget: true,
      projectAllocationUpperBound: true,
    },
  });

  return supervisors.map(({ userInInstance, ...s }) => ({
    id: userInInstance.user.id,
    name: userInInstance.user.name,
    email: userInInstance.user.email,
    projectTarget: s.projectAllocationTarget,
    projectUpperQuota: s.projectAllocationUpperBound,
  }));
}

export async function getAllSupervisorDetails(params: InstanceParams) {
  const supervisors = await db.supervisorDetails.findMany({
    where: expand(params),
    include: { userInInstance: { select: { user: true } } },
  });

  return supervisors.map(({ userInInstance, ...s }) => ({
    institutionId: userInInstance.user.id,
    fullName: userInInstance.user.name,
    email: userInInstance.user.email,
    projectTarget: s.projectAllocationTarget,
    projectUpperQuota: s.projectAllocationUpperBound,
  }));
}

export async function getAllFlags(params: InstanceParams) {
  return await db.flag.findMany({ where: expand(params) });
}
