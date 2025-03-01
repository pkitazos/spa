// MOVE these to some other file

import { ProjectDTO } from "@/dto/project";
import {
  DB_AllocationGroup,
  DB_AllocationInstance,
  DB_AllocationSubGroup,
  DB_Flag,
  DB_FlagOnProject,
  DB_FlagOnStudent,
  DB_ProjectDetails,
  DB_ProjectInInstance,
  DB_StudentDetails,
  DB_SupervisorDetails,
  DB_Tag,
  DB_TagOnProject,
  DB_User,
  DB_UserInInstance,
} from "./types";

import {
  FlagDTO,
  GroupDTO,
  InstanceDTO,
  InstanceUserDTO,
  SubGroupDTO,
  TagDTO,
} from "@/dto";
import { StudentDTO } from "@/dto/user/student";
import { StudentPreferenceRestrictionsDTO } from "@/dto/student";
import { SupervisorDetailsDTO } from "@/dto/supervisor";
import { SupervisorDTO } from "@/dto/supervisor_router";
import { AlgorithmDTO } from "@/lib/validations/algorithm";
import { AlgorithmConfig as DB_AlgorithmConfig } from "@prisma/client";

export function allocationGroupToDTO(data: DB_AllocationGroup): GroupDTO {
  return { group: data.id, displayName: data.displayName };
}

export function allocationSubGroupToDTO(
  data: DB_AllocationSubGroup,
): SubGroupDTO {
  return {
    group: data.allocationGroupId,
    subGroup: data.id,
    displayName: data.displayName,
  };
}

export function allocationInstanceToDTO(
  data: DB_AllocationInstance,
): InstanceDTO {
  return {
    group: data.allocationGroupId,
    subGroup: data.allocationSubGroupId,
    instance: data.id,
    displayName: data.displayName,
    stage: data.stage,
    selectedAlgConfigId: data.selectedAlgConfigId ?? undefined,
    parentInstanceId: data.parentInstanceId ?? undefined,
    projectSubmissionDeadline: data.projectSubmissionDeadline,
    supervisorAllocationAccess: data.supervisorAllocationAccess,
    minStudentPreferences: data.minStudentPreferences,
    maxStudentPreferences: data.maxStudentPreferences,
    maxStudentPreferencesPerSupervisor: data.maxStudentPreferencesPerSupervisor,
    studentPreferenceSubmissionDeadline:
      data.studentPreferenceSubmissionDeadline,
    studentAllocationAccess: data.studentAllocationAccess,
    minReaderPreferences: data.minReaderPreferences,
    maxReaderPreferences: data.maxReaderPreferences,
    readerPreferenceSubmissionDeadline: data.readerPreferenceSubmissionDeadline,
  };
}

export function supervisorToDTO(
  data: DB_SupervisorDetails & {
    userInInstance: DB_UserInInstance & { user: DB_User };
  },
): SupervisorDTO {
  return {
    id: data.userId,
    name: data.userInInstance.user.name,
    email: data.userInInstance.user.email,
    projectTarget: data.projectAllocationTarget,
    projectUpperQuota: data.projectAllocationUpperBound,
  };
}

export function supervisorDetailsToDTO(
  data: DB_SupervisorDetails,
): SupervisorDetailsDTO {
  return {
    supervisorId: data.userId,
    projectTarget: data.projectAllocationTarget,
    projectUpperQuota: data.projectAllocationUpperBound,
  };
}

export function studentToDTO(
  data: DB_StudentDetails & {
    userInInstance: DB_UserInInstance & { user: DB_User };
    studentFlags: (DB_FlagOnStudent & { flag: DB_Flag })[];
  },
): StudentDTO {
  return {
    id: data.userId,
    name: data.userInInstance.user.name,
    email: data.userInInstance.user.email,
    joined: data.userInInstance.joined,
    level: data.studentLevel,
    latestSubmission: data.latestSubmissionDateTime ?? undefined,
    flags: data.studentFlags.map((f) => f.flag),
  };
}

export function studentDetailsToDto(
  data: DB_StudentDetails & {
    studentFlags: (DB_FlagOnStudent & { flag: DB_Flag })[];
  },
): StudentDTO {
  return {
    studentId: data.userId,
    level: data.studentLevel,
    latestSubmissionDateTime: data.latestSubmissionDateTime ?? undefined,
    flags: data.studentFlags.map((f) => f.flag),
  };
}

export function instanceToStudentPreferenceRestrictionsDTO(
  data: InstanceDTO,
): StudentPreferenceRestrictionsDTO {
  return {
    minPreferences: data.minStudentPreferences,
    maxPreferences: data.maxStudentPreferences,
    maxPreferencesPerSupervisor: data.maxStudentPreferencesPerSupervisor,
    preferenceSubmissionDeadline: data.studentPreferenceSubmissionDeadline,
  };
}

export function projectDataToDTO(
  data: DB_ProjectInInstance & {
    details: DB_ProjectDetails & {
      flagsOnProject: (DB_FlagOnProject & { flag: DB_Flag })[];
      tagsOnProject: (DB_TagOnProject & { tag: DB_Tag })[];
    };
  },
): ProjectDTO {
  return {
    id: data.details.id,
    title: data.details.title,
    description: data.details.description,
    specialTechnicalRequirements:
      data.details.specialTechnicalRequirements ?? undefined,
    preAllocatedStudentId: data.details.preAllocatedStudentId ?? undefined,
    latestEditDateTime: data.details.latestEditDateTime,
    capacityLowerBound: data.details.capacityLowerBound,
    capacityUpperBound: data.details.capacityUpperBound,
    flags: data.details.flagsOnProject.map((f) => flagToDTO(f.flag)),
    tags: data.details.tagsOnProject.map((t) => tagToDTO(t.tag)),
  };
}

export function tagToDTO(data: DB_Tag): TagDTO {
  return { id: data.id, title: data.title };
}

export function flagToDTO(data: DB_Flag): FlagDTO {
  return { id: data.id, title: data.title, description: data.description };
}

export function userInInstanceToDTO(
  data: DB_UserInInstance & { user: DB_User },
): InstanceUserDTO {
  return {
    id: data.userId,
    name: data.user.name,
    email: data.user.email,
    joined: data.joined,
  };
}
export const toAlgorithmDTO = (a: DB_AlgorithmConfig): AlgorithmDTO => ({
  id: a.id,
  displayName: a.displayName,
  description: a.description ?? undefined,
  createdAt: a.createdAt,
  flag1: a.flag1,
  flag2: a.flag2 ?? undefined,
  flag3: a.flag3 ?? undefined,
  maxRank: a.maxRank,
  targetModifier: a.targetModifier,
  upperBoundModifier: a.upperBoundModifier,
});
