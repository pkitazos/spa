import { Stage } from "@prisma/client";

import { InstanceParams } from "@/lib/validations/params";
import { studentLevelSchema } from "@/lib/validations/student-level";

import {
  checkAllocationInstanceExists,
  getAllFlags,
  getAllocationInstance,
  getAllocationInstanceWithFlagsAndTags,
  getAllStudents,
  getAllSupervisorDetails,
  getAllSupervisors,
  getSelectedAlgorithm_fromDB,
  updateAllocationInstanceStage,
} from "@/data-access/instance";
import { StudentDetailsWithUser } from "@/data-access/student-details";
import { deleteUserInInstance } from "@/data-access/user";
import { StudentProjectAllocationData } from "@/data-objects/student-project-allocation-data";
import { DB, TX } from "@/db";

export async function getProjectAllocationsUseCase({
  params,
}: {
  params: InstanceParams;
}) {
  const allocationData = await StudentProjectAllocationData.fromDB(params);

  const byStudent = allocationData.toStudentView();
  const byProject = allocationData.toProjectView();
  const bySupervisor = allocationData.toSupervisorView();

  return { byStudent, byProject, bySupervisor };
}

export async function updateStageUseCase({
  params,
  stage,
}: {
  params: InstanceParams;
  stage: Stage;
}) {
  await updateAllocationInstanceStage(params, stage);
}

export async function checkInstanceExistsUseCase({
  params,
}: {
  params: InstanceParams;
}) {
  return await checkAllocationInstanceExists(params);
}

export async function getInstanceUseCase({
  params,
}: {
  params: InstanceParams;
}) {
  return await getAllocationInstance(params);
}

export async function getSelectedAlgorithmUseCase({
  params,
  selectedAlgName,
}: {
  params: InstanceParams;
  selectedAlgName: string | null;
}) {
  if (!selectedAlgName) {
    return {
      id: "",
      displayName: "",
    };
  }

  const algorithm = await getSelectedAlgorithm_fromDB(params, selectedAlgName);

  return {
    id: algorithm.algName,
    displayName: algorithm.displayName,
  };
}

export async function getEditFormDetailsUseCase({
  params,
}: {
  params: InstanceParams;
}) {
  const data = await getAllocationInstanceWithFlagsAndTags(params);

  return {
    ...data,
    instanceName: data.displayName,
    minNumPreferences: data.minStudentPreferences,
    maxNumPreferences: data.maxStudentPreferences,
    maxNumPerSupervisor: data.maxStudentPreferencesPerSupervisor,
  };
}

export async function allStudentsUseCase({
  params,
}: {
  params: InstanceParams;
}) {
  return await getAllStudents(params);
}

export async function getSupervisorsUseCase({
  params,
}: {
  params: InstanceParams;
}) {
  return await getAllSupervisors(params);
}

export async function getSupervisorDetailsUseCase({
  params,
}: {
  params: InstanceParams;
}) {
  return await getAllSupervisorDetails(params);
}

export async function getFlagTitlesUseCase({
  params,
}: {
  params: InstanceParams;
}) {
  const flags = await getAllFlags(params);
  return flags.map((f) => f.title);
}

// * version 1 - bad, uses DAL functions directly
export async function removeSupervisorUseCase({
  params,
  supervisorId,
}: {
  params: InstanceParams;
  supervisorId: string;
}) {
  await deleteUserInInstance(params, supervisorId);
}

// * version 2 - better, depends on DAL functions but doesn't use them directly
// can't do transaction this way as the DAL functions already use the default PrismaClient
export async function removeSupervisorsUseCase(
  {
    deleteUsersInInstance,
  }: {
    deleteUsersInInstance: (
      params: InstanceParams,
      supervisorIds: string[],
    ) => Promise<void>;
  },
  {
    params,
    supervisorIds,
  }: {
    params: InstanceParams;
    supervisorIds: string[];
  },
) {
  await deleteUsersInInstance(params, supervisorIds);
}

// * version 3 - best, depends on DAL functions and passes in the DB client
// can do transaction this way
// looks kinda terrible though
export async function getStudentsUseCase(
  {
    db,
    getStudentDetailsWithUser,
  }: {
    db: DB;
    getStudentDetailsWithUser: (
      db: DB,
      params: InstanceParams,
    ) => Promise<StudentDetailsWithUser>;
  },
  { params }: { params: InstanceParams },
) {
  const students = await getStudentDetailsWithUser(db, params);

  return students.map(({ userInInstance: { user }, studentLevel }) => ({
    institutionId: user.id,
    fullName: user.name!,
    email: user.email!,
    level: studentLevelSchema.parse(studentLevel),
  }));
}

export async function invitedStudentsUseCase(
  {
    db,
    getStudentDetailsWithUser,
    getPreAllocatedStudents,
  }: {
    db: DB;
    getStudentDetailsWithUser: (
      db: DB,
      params: InstanceParams,
    ) => Promise<StudentDetailsWithUser>;
    getPreAllocatedStudents: (
      db: TX,
      params: InstanceParams,
    ) => Promise<Set<string>>;
  },
  {
    params,
  }: {
    params: InstanceParams;
  },
) {
  const invitedStudents = await getStudentDetailsWithUser(db, params);

  const preAllocatedStudents = await getPreAllocatedStudents(db, params);

  const all = invitedStudents.map(({ userInInstance, studentLevel }) => ({
    id: userInInstance.user.id,
    name: userInInstance.user.name,
    email: userInInstance.user.email,
    joined: userInInstance.joined,
    level: studentLevel,
    preAllocated: preAllocatedStudents.has(userInInstance.user.id),
  }));

  return {
    all,
    incomplete: all.filter((s) => !s.joined && !s.preAllocated),
    preAllocated: all.filter((s) => s.preAllocated),
  };
}

export async function invitedSupervisorsUseCase(
  {
    db,
    getStudentDetailsWithUser,
  }: {
    db: DB;
    getStudentDetailsWithUser: (
      db: DB,
      params: InstanceParams,
    ) => Promise<StudentDetailsWithUser>;
  },
  { params }: { params: InstanceParams },
) {
  const invitedUsers = await getStudentDetailsWithUser(db, params);

  return {
    supervisors: invitedUsers.map(({ userInInstance }) => ({
      id: userInInstance.user.id,
      name: userInInstance.user.name,
      email: userInInstance.user.email,
      joined: userInInstance.joined,
    })),
  };
}
