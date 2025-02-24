import { expand } from "@/lib/utils/general/instance-params";
import { relativeComplement } from "@/lib/utils/general/set-difference";
import { setIntersection } from "@/lib/utils/general/set-intersection";
import { compareTitle } from "@/lib/utils/sorting/by-title";
import { InstanceParams } from "@/lib/validations/params";

import { Role, TX } from "@/db/types";

export async function mark(tx: TX, params: InstanceParams) {
  const forkedInstanceDetails = await getInstanceDetails(tx, params);
  const parentInstanceDetails = await getInstanceDetails(tx, {
    ...params,
    instance: forkedInstanceDetails.parentInstanceId!,
  });

  const instances = [parentInstanceDetails, forkedInstanceDetails] as const;

  const newStudents = await getNewStudents(...instances);

  // ? might not be necessary if I just delete all preferences of these students and just create the new ones
  const updatedStudents = await getUpdatedStudents(...instances);

  const newSupervisors = await getNewSupervisors(...instances);

  const newFlags = await getNewFlags(...instances);

  const newTags = await getNewTags(...instances);

  const newProjects = await getNewProjects(...instances);

  const updatedProjects = await getUpdatedProjects(...instances);

  const newFlagOnProjects = await getNewFlagOnProjects(...instances);

  const newTagOnProjects = await getNewTagOnProjects(...instances);

  return {
    newStudents,
    updatedStudents,
    newSupervisors,
    newFlags,
    newTags,
    newProjects,
    updatedProjects,
    newFlagOnProjects,
    newTagOnProjects,
    newAllocations: forkedInstanceDetails.projectAllocations,
  };
}

export type MergeMarkedData = Awaited<ReturnType<typeof mark>>;

async function getInstanceDetails(tx: TX, params: InstanceParams) {
  const { users, projects, flags, tags, ...data } =
    await tx.allocationInstance.findFirstOrThrow({
      where: {
        allocationGroupId: params.group,
        allocationSubGroupId: params.subGroup,
        id: params.instance,
      },
      include: {
        users: {
          include: {
            supervisorInstanceDetails: { where: expand(params) },
            studentPreferences: {
              where: expand(params),
              include: { project: true },
            },
            studentDetails: {
              where: expand(params),
              select: { studentLevel: true, latestSubmissionDateTime: true },
            },
          },
        },
        projects: { include: { allocations: { include: { project: true } } } },
        flags: {
          include: {
            flagOnProjects: { select: { flag: true, project: true } },
          },
        },
        tags: {
          include: { tagOnProject: { select: { tag: true, project: true } } },
        },
      },
    });

  return {
    ...data,

    students: users
      .filter((u) => u.role === Role.STUDENT)
      .map((s) => ({
        id: s.userId,
        level: s.studentDetails[0].studentLevel,
        latestSubmissionDateTime: s.studentDetails[0].latestSubmissionDateTime,
        preferences: s.studentPreferences.map((p) => ({
          projectTitle: p.project.title,
          type: p.type,
          rank: p.rank,
        })),
      })),

    supervisors: users
      .filter((u) => u.role === Role.SUPERVISOR)
      .map((s) => ({
        id: s.userId,
        projectAllocationTarget:
          s.supervisorInstanceDetails[0].projectAllocationTarget,
        projectAllocationUpperBound:
          s.supervisorInstanceDetails[0].projectAllocationUpperBound,
      })),

    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      specialTechnicalRequirements: p.specialTechnicalRequirements,
      capacityUpperBound: p.capacityUpperBound,
      supervisorId: p.supervisorId,
      latestEditDateTime: p.latestEditDateTime,
      preAllocatedStudentId: p.preAllocatedStudentId,
    })),

    flags: flags.map((f) => ({ id: f.id, title: f.title })),
    tags: tags.map((t) => ({ id: t.id, title: t.title })),

    flagOnProjects: flags.flatMap((f) =>
      f.flagOnProjects.map((fp) => ({
        flagTitle: f.title,
        projectTitle: fp.project.title,
      })),
    ),

    tagOnProjects: tags.flatMap((t) =>
      t.tagOnProject.map((tp) => ({
        tagTitle: t.title,
        projectTitle: tp.project.title,
      })),
    ),

    projectAllocations: projects.flatMap((p) =>
      p.allocations.map((a) => ({
        studentId: a.userId,
        projectTitle: a.project.title,
        rank: a.studentRanking,
      })),
    ),
  };
}

type InstanceDetails = Awaited<ReturnType<typeof getInstanceDetails>>;

async function getNewStudents(
  parentInstanceDetails: InstanceDetails,
  forkedInstanceDetails: InstanceDetails,
) {
  return relativeComplement(
    forkedInstanceDetails.students,
    parentInstanceDetails.students,
    (a, b) => a.id === b.id,
  );
}

async function getUpdatedStudents(
  parentInstanceDetails: InstanceDetails,
  forkedInstanceDetails: InstanceDetails,
) {
  return setIntersection(
    parentInstanceDetails.students,
    forkedInstanceDetails.students,
    (a) => a.id,
  );
}

async function getNewSupervisors(
  parentInstanceDetails: InstanceDetails,
  forkedInstanceDetails: InstanceDetails,
) {
  return relativeComplement(
    forkedInstanceDetails.supervisors,
    parentInstanceDetails.supervisors,
    (a, b) => a.id === b.id,
  );
}

async function getNewFlags(
  parentInstanceDetails: InstanceDetails,
  forkedInstanceDetails: InstanceDetails,
) {
  return relativeComplement(
    forkedInstanceDetails.flags,
    parentInstanceDetails.flags,
    (a, b) => a.title === b.title,
  ).sort(compareTitle);
}

async function getNewTags(
  parentInstanceDetails: InstanceDetails,
  forkedInstanceDetails: InstanceDetails,
) {
  return relativeComplement(
    forkedInstanceDetails.tags,
    parentInstanceDetails.tags,
    (a, b) => a.title === b.title,
  ).sort(compareTitle);
}

async function getNewProjects(
  parentInstanceDetails: InstanceDetails,
  forkedInstanceDetails: InstanceDetails,
) {
  return relativeComplement(
    forkedInstanceDetails.projects,
    parentInstanceDetails.projects,
    (a, b) => a.title === b.title,
  ).sort(compareTitle);
}

async function getUpdatedProjects(
  parentInstanceDetails: InstanceDetails,
  forkedInstanceDetails: InstanceDetails,
) {
  return setIntersection(
    parentInstanceDetails.projects,
    forkedInstanceDetails.projects,
    (a) => a.title,
  ).sort(compareTitle);
}

async function getNewFlagOnProjects(
  parentInstanceDetails: InstanceDetails,
  forkedInstanceDetails: InstanceDetails,
) {
  return relativeComplement(
    forkedInstanceDetails.flagOnProjects,
    parentInstanceDetails.flagOnProjects,
    (a, b) => a.flagTitle === b.flagTitle && a.projectTitle === b.projectTitle,
  );
}

async function getNewTagOnProjects(
  parentInstanceDetails: InstanceDetails,
  forkedInstanceDetails: InstanceDetails,
) {
  return relativeComplement(
    forkedInstanceDetails.tagOnProjects,
    parentInstanceDetails.tagOnProjects,
    (a, b) => a.tagTitle === b.tagTitle && a.projectTitle === b.projectTitle,
  );
}
